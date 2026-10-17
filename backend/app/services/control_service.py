"""Контроль просрочек и рассылка уведомлений по ним."""
from datetime import date, datetime

from .. import models
from ..dto.control import OverdueItem
from ..dto.notifications import NotifyResult
from ..repositories import InventoryRepository, NotificationRepository
from ..unit_of_work import UnitOfWork


class ControlService:
    def __init__(
        self,
        uow: UnitOfWork,
        inventory: InventoryRepository,
        notifications: NotificationRepository,
    ):
        self.uow = uow
        self.inventory = inventory
        self.notifications = notifications

    def get_overdue(self) -> list[OverdueItem]:
        today = date.today()
        result = []
        for item in self.inventory.list_due_before(today):
            if item.status and item.status.Status == models.STATUS_RETURNED:
                continue  # уже сдано — не просрочка
            if item.employee is None:
                continue
            result.append(OverdueItem(
                employeeName=item.employee.Name,
                sizName=item.equipment.Name if item.equipment else "—",
                dueAt=item.Due_date,
                overdueDays=(today - item.Due_date).days,
                inventory_id=item.ID_inv,
                employee_id=item.ID_employee,
            ))
        return result

    def notify_all(self) -> NotifyResult:
        """
        Создаёт уведомления по просрочкам. Если по выдаче уже есть непогашенное
        уведомление, повторно оно не создаётся (skipped).
        """
        already = self.notifications.active_inventory_ids()
        now = datetime.now()
        notified = skipped = 0
        for item in self.get_overdue():
            if item.inventory_id in already:
                skipped += 1
                continue
            self.notifications.add(models.Notification(
                ID_Employee=item.employee_id,
                ID_inv=item.inventory_id,
                Date_sent=now,
                Is_cleared=False,
            ))
            notified += 1
        self.uow.commit()
        return NotifyResult(notified=notified, skipped=skipped)
