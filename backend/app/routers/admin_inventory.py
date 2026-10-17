from fastapi import APIRouter, Depends
from ..dependencies import get_inventory_service, require_admin
from ..dto.common import OkResponse
from ..dto.inventory import AssignedSizItem, AssignSizBody, EmployeeSearchResult
from ..services.inventory_service import InventoryService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin: inventory"],
    dependencies=[Depends(require_admin)],
)


@router.get("/employees/search", response_model=list[EmployeeSearchResult])
def search_employees(q: str = "", service: InventoryService = Depends(get_inventory_service)):
    return service.search_employees(q)


@router.get("/employees/{employee_id}/siz", response_model=list[AssignedSizItem])
def get_employee_siz(employee_id: int, service: InventoryService = Depends(get_inventory_service)):
    return service.list_assigned(employee_id)


@router.post("/employees/{employee_id}/siz", response_model=AssignedSizItem)
def assign_siz(
    employee_id: int,
    body: AssignSizBody,
    service: InventoryService = Depends(get_inventory_service),
):
    return service.assign(employee_id, body)


@router.delete("/inventory/{inventory_id}", response_model=OkResponse)
def delete_inventory(inventory_id: int, service: InventoryService = Depends(get_inventory_service)):
    service.remove(inventory_id)
    return OkResponse()
