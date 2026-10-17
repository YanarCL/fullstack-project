from typing import Optional

from sqlalchemy import func

from ..models import EquipmentType
from .base import BaseRepository


class EquipmentTypeRepository(BaseRepository[EquipmentType]):
    model = EquipmentType

    def list_ordered(self) -> list[EquipmentType]:
        return self.db.query(EquipmentType).order_by(EquipmentType.Name).all()

    def find_by_name(self, name: str) -> Optional[EquipmentType]:
        return self.db.query(EquipmentType).filter(
            func.lower(EquipmentType.Name) == name.lower()
        ).first()
