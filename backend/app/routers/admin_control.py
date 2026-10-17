from fastapi import APIRouter, Depends
from ..dependencies import get_control_service, require_admin
from ..dto.control import OverdueItem
from ..dto.notifications import NotifyResult
from ..services.control_service import ControlService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin: control"],
    dependencies=[Depends(require_admin)],
)


@router.get("/control/overdue", response_model=list[OverdueItem])
def get_overdue(service: ControlService = Depends(get_control_service)):
    return service.get_overdue()


@router.post("/control/notify-all", response_model=NotifyResult)
def notify_all_overdue(service: ControlService = Depends(get_control_service)):
    return service.notify_all()
