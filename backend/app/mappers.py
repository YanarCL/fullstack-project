from . import models
from .dto.catalog import CatalogItem
from .dto.inventory import AssignedSizItem, EmployeeSearchResult, EmployeeSizItem
from .dto.notifications import NotificationItem
from .dto.requests import AdminRequestItem, EmployeeRequestItem


def _status_code(ru_status: str) -> str:
    return models.REQUEST_STATUS_RU_TO_CODE.get(ru_status, ru_status)


def to_catalog_item(e: models.Equipment) -> CatalogItem:
    return CatalogItem(
        id=e.ID_catalog,
        name=e.Name,
        type=e.type.Name if e.type else None,
        typeId=e.ID_type,
        lifespanWeeks=e.Service_life,
    )


def to_assigned_item(i: models.Inventory) -> AssignedSizItem:
    return AssignedSizItem(
        id=i.ID_inv,
        name=i.equipment.Name if i.equipment else "—",
        type=i.equipment.type.Name if i.equipment and i.equipment.type else None,
        status=i.status.Status if i.status else None,
        receivedAt=i.Issue_date,
        dueAt=i.Due_date,
    )


def to_employee_siz(i: models.Inventory) -> EmployeeSizItem:
    status_name = i.status.Status if i.status else None
    return EmployeeSizItem(
        id=i.ID_inv,
        name=i.equipment.Name if i.equipment else "—",
        type=i.equipment.type.Name if i.equipment and i.equipment.type else None,
        receivedAt=i.Issue_date,
        dueAt=i.Due_date,
        returned=(status_name == models.STATUS_RETURNED),
    )


def to_employee_search(e: models.Employee) -> EmployeeSearchResult:
    return EmployeeSearchResult(id=e.ID_Employee, name=e.Name, login=e.Login)


def to_admin_request(r: models.Request) -> AdminRequestItem:
    return AdminRequestItem(
        id=r.ID_req,
        employeeId=r.ID_Employee,
        employeeName=r.employee.Name if r.employee else "—",
        shop=r.employee.workshop.WorkShop if r.employee and r.employee.workshop else None,
        status=_status_code(r.Status),
        comment=r.Comment,
    )


def to_employee_request(r: models.Request) -> EmployeeRequestItem:
    return EmployeeRequestItem(id=r.ID_req, date=r.Request_date, status=_status_code(r.Status))


def to_notification(n: models.Notification) -> NotificationItem:
    return NotificationItem(
        id=n.ID_notification,
        date=n.Date_sent,
        name=n.inventory.equipment.Name if n.inventory and n.inventory.equipment else "—",
    )
