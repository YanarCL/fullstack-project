from fastapi import APIRouter, Depends
from ..dependencies import get_request_service, require_admin
from ..dto.requests import AdminRequestItem, UpdateRequestStatusBody
from ..services.request_service import RequestService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin: requests"],
    dependencies=[Depends(require_admin)],
)


@router.get("/requests", response_model=list[AdminRequestItem])
def list_requests(service: RequestService = Depends(get_request_service)):
    return service.list_all()


@router.patch("/requests/{request_id}", response_model=AdminRequestItem)
def update_request_status(
    request_id: int,
    body: UpdateRequestStatusBody,
    service: RequestService = Depends(get_request_service),
):
    return service.set_status(request_id, body.status)
