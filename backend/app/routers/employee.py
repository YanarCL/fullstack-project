from fastapi import APIRouter, Depends

from ..dependencies import (
    get_current_employee,
    get_inventory_service,
    get_notification_service,
    get_request_service,
)
from ..dto.auth import CurrentUser
from ..dto.common import OkResponse
from ..dto.inventory import EmployeeSizItem
from ..dto.notifications import NotificationItem
from ..dto.requests import CreateRequestBody, EmployeeRequestItem
from ..services.inventory_service import InventoryService
from ..services.notification_service import NotificationService
from ..services.request_service import RequestService

router = APIRouter(prefix="/api/employee", tags=["employee"])


@router.get("/siz", response_model=list[EmployeeSizItem])
def get_my_siz(
    me: CurrentUser = Depends(get_current_employee),
    service: InventoryService = Depends(get_inventory_service),
):
    return service.list_mine(me.id)


@router.post("/siz/{inv_id}/return", response_model=OkResponse)
def return_siz(
    inv_id: int,
    me: CurrentUser = Depends(get_current_employee),
    service: InventoryService = Depends(get_inventory_service),
):
    service.mark_returned(inv_id, me.id)
    return OkResponse()

@router.get("/requests", response_model=list[EmployeeRequestItem])
def get_my_requests(
    me: CurrentUser = Depends(get_current_employee),
    service: RequestService = Depends(get_request_service),
):
    return service.list_mine(me.id)


@router.post("/requests", response_model=EmployeeRequestItem)
def create_request(
    body: CreateRequestBody,
    me: CurrentUser = Depends(get_current_employee),
    service: RequestService = Depends(get_request_service),
):
    return service.create_mine(me.id, body.comment)


@router.get("/notifications", response_model=list[NotificationItem])
def get_my_notifications(
    me: CurrentUser = Depends(get_current_employee),
    service: NotificationService = Depends(get_notification_service),
):
    return service.list_mine(me.id)


@router.post("/notifications/clear", response_model=OkResponse)
def clear_my_notifications(
    me: CurrentUser = Depends(get_current_employee),
    service: NotificationService = Depends(get_notification_service),
):
    service.clear_mine(me.id)
    return OkResponse()
