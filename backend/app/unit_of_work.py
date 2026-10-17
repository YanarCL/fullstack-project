from sqlalchemy.orm import Session

class UnitOfWork:
    def __init__(self, db: Session):
        self._db = db

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()

    def refresh(self, entity) -> None:
        self._db.refresh(entity)
