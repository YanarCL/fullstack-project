from typing import Optional

from ..models import Status
from .base import BaseRepository


class StatusRepository(BaseRepository[Status]):
    model = Status

    def get_by_name(self, name: str) -> Optional[Status]:
        return self.db.query(Status).filter(Status.Status == name).first()
