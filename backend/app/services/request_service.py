"""Запросы на дополнительные СИЗ."""
from datetime import datetime
from typing import Optional

from .. import models
from ..dto.requests import AdminRequestItem, EmployeeRequestItem
from ..exceptions import BadRequestError, NotFoundError
from ..mappers import to_admin_request, to_employee_request
from ..repositories import RequestRepository
from ..unit_of_work import UnitOfWork


class RequestService:
    def __init__(self, uow: UnitOfWork, requests: RequestRepository):
        self.uow = uow
        self.requests = requests

    # ---------- админ ----------

    def list_all(self) -> list[AdminRequestItem]:
        return [to_admin_request(r) for r in self.requests.list_newest()]

    def set_status(self, request_id: int, status_code: str) -> AdminRequestItem:
        request = self.requests.get(request_id)
        if request is None:
            raise NotFoundError("Запрос не найден")

        ru_status = models.REQUEST_STATUS_CODE_TO_RU.get(status_code)
        if ru_status is None:
            raise BadRequestError("Неизвестный статус")

        request.Status = ru_status
        self.uow.commit()
        return to_admin_request(request)

    # ---------- сотрудник ----------

    def list_mine(self, employee_id: int) -> list[EmployeeRequestItem]:
        return [to_employee_request(r) for r in self.requests.list_by_employee_newest(employee_id)]

    def create_mine(self, employee_id: int, comment: Optional[str]) -> EmployeeRequestItem:
        request = self.requests.add(models.Request(
            ID_Employee=employee_id,
            Request_date=datetime.now(),
            Status="Ожидает",
            Comment=comment,
        ))
        self.uow.commit()
        self.uow.refresh(request)
        return to_employee_request(request)
