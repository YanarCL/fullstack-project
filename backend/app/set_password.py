import getpass
import sys

from . import security
from .database import SessionLocal
from .repositories import EmployeeRepository
from .unit_of_work import UnitOfWork


def main() -> int:
    if len(sys.argv) != 2:
        print("Использование: python -m app.set_password <логин>")
        return 2
    login = sys.argv[1]

    db = SessionLocal()
    try:
        employee = EmployeeRepository(db).get_by_login(login)
        if employee is None:
            print(f"Пользователь «{login}» не найден")
            return 1

        password = getpass.getpass("Новый пароль: ")
        if not password:
            print("Пароль не может быть пустым")
            return 1
        if password != getpass.getpass("Повторите пароль: "):
            print("Пароли не совпадают")
            return 1

        employee.Password = security.hash_password(password)
        UnitOfWork(db).commit()
        print(f"Пароль пользователя «{login}» обновлён")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
