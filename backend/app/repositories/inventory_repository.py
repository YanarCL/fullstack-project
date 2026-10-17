from datetime import date
from typing import Optional

from ..models import Inventory
from .base import BaseRepository

class InventoryRepository(BaseRepository[Inventory]):
    model = Inventory

    def list_by_employee(self, employee_id: int, newest_first: bool = False) -> list[Inventory]:
        query = self.db.query(Inventory).filter(Inventory.ID_employee == employee_id)
        if newest_first:
            query = query.order_by(Inventory.ID_inv.desc())
        return query.all()

    def get_for_employee(self, inventory_id: int, employee_id: int) -> Optional[Inventory]:
        return self.db.query(Inventory).filter(
            Inventory.ID_inv == inventory_id,
            Inventory.ID_employee == employee_id,
        ).first()

    def count_by_equipment(self, equipment_id: int) -> int:
        return self.db.query(Inventory).filter(Inventory.ID_catalog == equipment_id).count()

    def list_due_before(self, day: date) -> list[Inventory]:
        return self.db.query(Inventory).filter(
            Inventory.Due_date.isnot(None),
            Inventory.Due_date < day,
        ).all()
