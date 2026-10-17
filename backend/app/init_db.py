import logging
import os
import time
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError
from . import models, security
from .database import Base, SessionLocal, engine
from .repositories import (
    EmployeeRepository,
    EquipmentRepository,
    EquipmentTypeRepository,
    StatusRepository,
    WorkshopRepository,
)
from .unit_of_work import UnitOfWork

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s: %(message)s")
logger = logging.getLogger("siz.init_db")

ADMIN_LOGIN = os.getenv("ADMIN_LOGIN", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Администратор")
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "true").lower() in ("1", "true", "yes")


def wait_for_db(retries: int = 40, delay: float = 3.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            with engine.connect():
                return
        except OperationalError as exc:
            logger.info("БД пока недоступна (попытка %s/%s): %s", attempt, retries, exc.orig)
            time.sleep(delay)
    raise SystemExit("Не удалось подключиться к БД — проверьте DB_HOST / DB_USER / DB_PASSWORD / DB_NAME")


def ensure_password_column(min_length: int = 60) -> None:
    columns = {c["name"]: c for c in inspect(engine).get_columns("employee")}
    length = getattr(columns["Password"]["type"], "length", None)
    if length is not None and length < min_length:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE employee MODIFY Password VARCHAR(255) NOT NULL"))
        logger.info("Столбец employee.Password расширен с VARCHAR(%s) до VARCHAR(255) под bcrypt-хэши", length)


def migrate_passwords(uow: UnitOfWork, employees: EmployeeRepository) -> int:
    
    migrated = 0
    for employee in employees.list_all():
        if not security.is_hashed(employee.Password):
            employee.Password = security.hash_password(employee.Password)
            migrated += 1
    if migrated:
        uow.commit()
        logger.info("Пароли переведены на bcrypt-хэши: %s уч. записей", migrated)
    return migrated


def seed(
    uow: UnitOfWork,
    statuses: StatusRepository,
    employees: EmployeeRepository,
    workshops: WorkshopRepository,
    types: EquipmentTypeRepository,
    equipment: EquipmentRepository,
) -> None:
    for name in (models.STATUS_ISSUED, models.STATUS_RETURNED):
        if statuses.get_by_name(name) is None:
            statuses.add(models.Status(Status=name))
            logger.info("Добавлен статус «%s»", name)

    is_new_database = not employees.search("", limit=1)
    if is_new_database:
        workshop = workshops.add(models.Workshop(WorkShop="Цех №1"))
        workshops.flush()
        employees.add(models.Employee(
            Name=ADMIN_NAME, Login=ADMIN_LOGIN, Password=security.hash_password(ADMIN_PASSWORD),
            Role="admin", ID_WorkShop=workshop.ID_WorkShop,
        ))
        logger.info("БД пустая — создан администратор: логин «%s»", ADMIN_LOGIN)

        if SEED_DEMO_DATA and not equipment.list_all():
            employees.add(models.Employee(
                Name="Иван Петров", Login="ivan", Password=security.hash_password("ivan"), Role="employee",
                ID_WorkShop=workshop.ID_WorkShop,
            ))
            head = types.add(models.EquipmentType(Name="Защита головы"))
            hands = types.add(models.EquipmentType(Name="Защита рук"))
            lungs = types.add(models.EquipmentType(Name="Защита органов дыхания"))
            types.flush()
            equipment.add(models.Equipment(Name="Каска защитная", ID_type=head.ID_type, Service_life=104))
            equipment.add(models.Equipment(Name="Перчатки диэлектрические", ID_type=hands.ID_type, Service_life=26))
            equipment.add(models.Equipment(Name="Респиратор FFP2", ID_type=lungs.ID_type, Service_life=12))
            logger.info("Добавлены демо-данные: сотрудник ivan/ivan и каталог СИЗ")
    else:
        logger.info("В БД уже есть сотрудники — пользователей и демо-данные не добавляем")

    uow.commit()


def main() -> None:
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    ensure_password_column()
    db = SessionLocal()
    try:
        uow = UnitOfWork(db)
        employees = EmployeeRepository(db)
        seed(
            uow,
            StatusRepository(db),
            employees,
            WorkshopRepository(db),
            EquipmentTypeRepository(db),
            EquipmentRepository(db),
        )
        migrate_passwords(uow, employees)
    finally:
        db.close()
    logger.info("База данных готова")


if __name__ == "__main__":
    main()
