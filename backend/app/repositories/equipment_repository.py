from ..models import Equipment
from .base import BaseRepository


class EquipmentRepository(BaseRepository[Equipment]):
    model = Equipment

    def list_all(self, search: str = "") -> list[Equipment]:
        query = self.db.query(Equipment)
        if search:
            query = query.filter(Equipment.Name.ilike(f"%{search}%"))
        return query.order_by(Equipment.ID_catalog).all()
