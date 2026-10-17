from fastapi import APIRouter, Depends

from ..dependencies import get_catalog_service, require_admin
from ..dto.catalog import (
    BulkDeleteBody,
    BulkDeleteResult,
    CatalogBulkUpdateBody,
    CatalogItem,
    CatalogItemCreate,
    EquipmentTypeItem,
)
from ..dto.common import OkResponse
from ..services.catalog_service import CatalogService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin: catalog"],
    dependencies=[Depends(require_admin)],
)


@router.get("/types", response_model=list[EquipmentTypeItem])
def list_types(service: CatalogService = Depends(get_catalog_service)):
    return service.list_types()


@router.get("/equipment", response_model=list[CatalogItem])
def list_equipment(search: str = "", service: CatalogService = Depends(get_catalog_service)):
    return service.list_equipment(search)


@router.post("/equipment", response_model=CatalogItem)
def create_equipment(body: CatalogItemCreate, service: CatalogService = Depends(get_catalog_service)):
    return service.create(body)

@router.put("/equipment/bulk-update", response_model=list[CatalogItem])
def bulk_update_equipment(
    body: CatalogBulkUpdateBody, service: CatalogService = Depends(get_catalog_service)
):
    return service.bulk_update(body.items)


@router.post("/equipment/bulk-delete", response_model=BulkDeleteResult)
def bulk_delete_equipment(body: BulkDeleteBody, service: CatalogService = Depends(get_catalog_service)):
    return service.bulk_delete(body.ids)


@router.put("/equipment/{equipment_id}", response_model=CatalogItem)
def update_equipment(
    equipment_id: int, body: CatalogItemCreate, service: CatalogService = Depends(get_catalog_service)
):
    return service.update(equipment_id, body)


@router.delete("/equipment/{equipment_id}", response_model=OkResponse)
def delete_equipment(equipment_id: int, service: CatalogService = Depends(get_catalog_service)):
    service.delete(equipment_id)
    return OkResponse()
