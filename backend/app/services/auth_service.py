import logging

from .. import security
from ..dto.auth import LoginRequest, LoginResponse
from ..exceptions import UnauthorizedError
from ..models import Employee
from ..repositories import EmployeeRepository
from ..unit_of_work import UnitOfWork

logger = logging.getLogger("siz.auth")


class AuthService:
    def __init__(self, uow: UnitOfWork, employees: EmployeeRepository):
        self.uow = uow
        self.employees = employees

    def login(self, data: LoginRequest) -> LoginResponse:
        employee = self.employees.get_by_login(data.login)
        if employee is None:
            security.burn_time(data.password)  # одинаковое время ответа для «нет такого логина»
            raise UnauthorizedError("Неверный логин или пароль")
        if not security.verify_password(data.password, employee.Password):
            raise UnauthorizedError("Неверный логин или пароль")

        # значения берём заранее: ниже возможен commit/rollback, после которого ORM перечитывает объект
        employee_id, role, name = employee.ID_Employee, employee.Role, employee.Name
        self._hash_plaintext_password(employee, data.password)

        token = security.create_access_token({"sub": str(employee_id), "role": role})
        return LoginResponse(access_token=token, role=role, employee_id=employee_id, name=name)

    def _hash_plaintext_password(self, employee: Employee, plain_password: str) -> None:
        """
        Однократное хэширование: пароль, сохранённый открытым текстом, заменяется bcrypt-хэшем
        «по пути» при успешном входе. Готовые хэши не трогаются — автоматически они не обновляются.
        Ошибка здесь не должна мешать входу (например, если столбец Password слишком короткий).
        """
        if security.is_hashed(employee.Password):
            return
        try:
            employee.Password = security.hash_password(plain_password)
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            logger.warning(
                "Не удалось сохранить хэш пароля (проверьте, что столбец employee.Password >= VARCHAR(60))",
                exc_info=True,
            )
