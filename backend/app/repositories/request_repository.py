from ..models import Request, RequestItem
from .base import BaseRepository


class RequestRepository(BaseRepository[Request]):
    model = Request

    def list_newest(self) -> list[Request]:
        return self.db.query(Request).order_by(Request.Request_date.desc()).all()

    def list_by_employee_newest(self, employee_id: int) -> list[Request]:
        return (
            self.db.query(Request)
            .filter(Request.ID_Employee == employee_id)
            .order_by(Request.Request_date.desc())
            .all()
        )


class RequestItemRepository(BaseRepository[RequestItem]):
    model = RequestItem

    def clear_inventory_references(self, inventory_id: int) -> None:
        for column in ("ID_inv_old", "ID_inv_new"):
            self.db.query(RequestItem).filter(
                getattr(RequestItem, column) == inventory_id
            ).update({column: None}, synchronize_session=False)
