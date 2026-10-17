"""Выданные СИЗ: выдача/удаление админом, просмотр и сдача сотрудником."""
from datetime import date

from .. import models
from ..dto.inventory import AssignedSizItem, AssignSizBody, EmployeeSearchResult, EmployeeSizItem
from ..exceptions import BadRequestError, InternalError, NotFoundError
from ..mappers import to_assigned_item, to_employee_search, to_employee_siz
from ..repositories import (
    EmployeeRepository,
    EquipmentRepository,
    InventoryRepository,
    NotificationRepository,
    RequestItemRepository,
    StatusRepository,
)
from ..unit_of_work import UnitOfWork


class InventoryService:
    def __init__(
        self,
        uow: UnitOfWork,
        employees: EmployeeRepository,
        equipment: EquipmentRepository,
        inventory: InventoryRepository,
        statuses: StatusRepository,
        notifications: NotificationRepository,
        request_items: RequestItemRepository,
    ):
        self.uow = uow
        self.employees = employees
        self.equipment = equipment
        self.inventory = inventory
        self.statuses = statuses
        self.notifications = notifications
        self.request_items = request_items

    # ---------- админ ----------

    def search_employees(self, text: str) -> list[EmployeeSearchResult]:
        return [to_employee_search(e) for e in self.employees.search(text)]

    def list_assigned(self, employee_id: int) -> list[AssignedSizItem]:
        items = self.inventory.list_by_employee(employee_id, newest_first=True)
        return [to_assigned_item(i) for i in items]

    def assign(self, employee_id: int, data: AssignSizBody) -> AssignedSizItem:
        if self.employees.get(employee_id) is None:
            raise NotFoundError("Сотрудник не найден")
        if self.equipment.get(data.equipment_id) is None:
            raise NotFoundError(f"СИЗ с ID {data.equipment_id} нет в каталоге")

        issued_status = self.statuses.get_by_name(models.STATUS_ISSUED)
        if issued_status is None:
            raise InternalError("В таблице status нет записи 'Выдано'")

        issue_date = data.issued_at or date.today()
        if data.due_at is not None and data.due_at < issue_date:
            raise BadRequestError("Срок сдачи не может быть раньше даты получения")

        item = self.inventory.add(models.Inventory(
            ID_catalog=data.equipment_id,
            ID_status=issued_status.ID_status,
            ID_employee=employee_id,
            Issue_date=issue_date,
            Due_date=data.due_at,
        ))
        self.uow.commit()
        self.uow.refresh(item)
        return to_assigned_item(item)

    def remove(self, inventory_id: int) -> None:
        item = self.inventory.get(inventory_id)
        if item is None:
            raise NotFoundError("Не найдено")

        # На экземпляр ссылаются уведомления и позиции запросов (FK): уведомления
        # теряют смысл — удаляем, в запросах только обнуляем ссылку.
        self.notifications.delete_by_inventory(inventory_id)
        self.request_items.clear_inventory_references(inventory_id)
        self.inventory.delete(item)
        self.uow.commit()

    # ---------- сотрудник ----------

    def list_mine(self, employee_id: int) -> list[EmployeeSizItem]:
        return [to_employee_siz(i) for i in self.inventory.list_by_employee(employee_id)]

    def mark_returned(self, inventory_id: int, employee_id: int) -> None:
        item = self.inventory.get_for_employee(inventory_id, employee_id)
        if item is None:
            raise NotFoundError("СИЗ не найден")

        returned_status = self.statuses.get_by_name(models.STATUS_RETURNED)
        if returned_status is None:
            raise InternalError("В таблице status нет записи 'Сдано'")

        item.ID_status = returned_status.ID_status
        self.uow.commit()
