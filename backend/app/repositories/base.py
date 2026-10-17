from typing import Generic, Optional, TypeVar

from sqlalchemy.orm import Session

T = TypeVar("T")


class BaseRepository(Generic[T]):

    model: type[T]

    def __init__(self, db: Session):
        self.db = db

    def get(self, entity_id: int) -> Optional[T]:
        return self.db.get(self.model, entity_id)

    def add(self, entity: T) -> T:
        self.db.add(entity)
        return entity

    def delete(self, entity: T) -> None:
        self.db.delete(entity)

    def flush(self) -> None:
        self.db.flush()
