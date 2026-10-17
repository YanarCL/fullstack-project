"""Уведомления сотрудника и автоочистка старых."""
from datetime import datetime, timedelta

from ..dto.notifications import NotificationItem
from ..mappers import to_notification
from ..repositories import NotificationRepository
from ..unit_of_work import UnitOfWork


class NotificationService:
    def __init__(self, uow: UnitOfWork, notifications: NotificationRepository):
        self.uow = uow
        self.notifications = notifications

    def list_mine(self, employee_id: int) -> list[NotificationItem]:
        return [to_notification(n) for n in self.notifications.list_active_for_employee(employee_id)]

    def clear_mine(self, employee_id: int) -> None:
        self.notifications.clear_for_employee(employee_id)
        self.uow.commit()

    def purge_cleared(self, retention_days: int) -> int:
        """Удаляет ПОГАШЕННЫЕ уведомления старше retention_days дней. Возвращает число удалённых."""
        cutoff = datetime.now() - timedelta(days=retention_days)
        deleted = self.notifications.delete_cleared_before(cutoff)
        self.uow.commit()
        return deleted
