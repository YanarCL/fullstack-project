from ..models import Workshop
from .base import BaseRepository


class WorkshopRepository(BaseRepository[Workshop]):
    model = Workshop
