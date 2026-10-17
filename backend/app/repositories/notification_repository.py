from datetime import datetime

from ..models import Notification
from .base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    def list_active_for_employee(self, employee_id: int) -> list[Notification]:
        return (
            self.db.query(Notification)
            .filter(
                Notification.ID_Employee == employee_id,
                Notification.Is_cleared == False,  
            )
            .order_by(Notification.Date_sent.desc())
            .all()
        )

    def active_inventory_ids(self) -> set[int]:
        """ID экземпляров СИЗ, по которым уже есть непогашенное уведомление."""
        rows = self.db.query(Notification.ID_inv).filter(
            Notification.Is_cleared == False  
        )
        return {inv_id for (inv_id,) in rows}

    def clear_for_employee(self, employee_id: int) -> None:
        self.db.query(Notification).filter(
            Notification.ID_Employee == employee_id
        ).update({"Is_cleared": True})

    def delete_by_inventory(self, inventory_id: int) -> None:
        self.db.query(Notification).filter(
            Notification.ID_inv == inventory_id
        ).delete(synchronize_session=False)

    def delete_cleared_before(self, cutoff: datetime) -> int:
        return (
            self.db.query(Notification)
            .filter(
                Notification.Is_cleared == True,  
                Notification.Date_sent < cutoff,
            )
            .delete(synchronize_session=False)
        )
