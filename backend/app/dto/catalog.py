from typing import Optional
from pydantic import BaseModel


class EquipmentTypeItem(BaseModel):
    id: int
    name: str


class CatalogItem(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    typeId: Optional[int] = None
    lifespanWeeks: Optional[int] = None


class CatalogItemCreate(BaseModel):
    name: str
    type_id: Optional[int] = None
    type_name: Optional[str] = None
    lifespan_weeks: Optional[int] = None


class CatalogItemUpdate(CatalogItemCreate):
    id: int


class CatalogBulkUpdateBody(BaseModel):
    items: list[CatalogItemUpdate]


class BulkDeleteBody(BaseModel):
    ids: list[int]


class BulkDeleteFailure(BaseModel):
    id: int
    name: Optional[str] = None
    reason: str


class BulkDeleteResult(BaseModel):
    deleted: list[int]
    failed: list[BulkDeleteFailure]
