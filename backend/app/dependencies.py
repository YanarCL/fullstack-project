from typing import Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import security
from .database import get_db
from .dto.auth import CurrentUser
from .exceptions import ForbiddenError, UnauthorizedError
from .repositories import (
    EmployeeRepository,
    EquipmentRepository,
    EquipmentTypeRepository,
    InventoryRepository,
    NotificationRepository,
    RequestItemRepository,
    RequestRepository,
    StatusRepository,
)
from .services.auth_service import AuthService
from .services.catalog_service import CatalogService
from .services.control_service import ControlService
from .services.inventory_service import InventoryService
from .services.notification_service import NotificationService
from .services.request_service import RequestService
from .unit_of_work import UnitOfWork

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UnitOfWork(db), EmployeeRepository(db))


def get_catalog_service(db: Session = Depends(get_db)) -> CatalogService:
    return CatalogService(
        UnitOfWork(db),
        EquipmentRepository(db),
        EquipmentTypeRepository(db),
        InventoryRepository(db),
    )


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    return InventoryService(
        UnitOfWork(db),
        EmployeeRepository(db),
        EquipmentRepository(db),
        InventoryRepository(db),
        StatusRepository(db),
        NotificationRepository(db),
        RequestItemRepository(db),
    )


def get_request_service(db: Session = Depends(get_db)) -> RequestService:
    return RequestService(UnitOfWork(db), RequestRepository(db))


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(UnitOfWork(db), NotificationRepository(db))


def get_control_service(db: Session = Depends(get_db)) -> ControlService:
    return ControlService(UnitOfWork(db), InventoryRepository(db), NotificationRepository(db))


def get_current_employee(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    error = UnauthorizedError(
        "Не удалось подтвердить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise error
    employee_id = security.decode_employee_id(token)
    if employee_id is None:
        raise error
    employee = EmployeeRepository(db).get(employee_id)
    if employee is None:
        raise error
    return CurrentUser(id=employee.ID_Employee, name=employee.Name, role=employee.Role)


def require_admin(user: CurrentUser = Depends(get_current_employee)) -> CurrentUser:
    if user.role != "admin":
        raise ForbiddenError("Недостаточно прав (нужна роль admin)")
    return user
