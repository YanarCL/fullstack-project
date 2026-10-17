"""Каталог СИЗ: правила валидации, типы, массовое сохранение и удаление."""
from typing import Optional

from .. import models
from ..dto.catalog import (
    BulkDeleteFailure,
    BulkDeleteResult,
    CatalogItem,
    CatalogItemCreate,
    CatalogItemUpdate,
    EquipmentTypeItem,
)
from ..exceptions import BadRequestError, ConflictError, NotFoundError
from ..mappers import to_catalog_item
from ..repositories import EquipmentRepository, EquipmentTypeRepository, InventoryRepository
from ..unit_of_work import UnitOfWork


class CatalogService:
    def __init__(
        self,
        uow: UnitOfWork,
        equipment: EquipmentRepository,
        types: EquipmentTypeRepository,
        inventory: InventoryRepository,
    ):
        self.uow = uow
        self.equipment = equipment
        self.types = types
        self.inventory = inventory

    # ---------- чтение ----------

    def list_types(self) -> list[EquipmentTypeItem]:
        return [EquipmentTypeItem(id=t.ID_type, name=t.Name) for t in self.types.list_ordered()]

    def list_equipment(self, search: str = "") -> list[CatalogItem]:
        return [to_catalog_item(e) for e in self.equipment.list_all(search)]

    # ---------- изменение ----------

    def create(self, data: CatalogItemCreate) -> CatalogItem:
        entity = models.Equipment(
            Name=self._clean_name(data.name),
            Service_life=self._check_lifespan(data.lifespan_weeks),
            ID_type=self._resolve_type_id(data.type_id, data.type_name),
        )
        self.equipment.add(entity)
        self.uow.commit()
        self.uow.refresh(entity)
        return to_catalog_item(entity)

    def update(self, equipment_id: int, data: CatalogItemCreate) -> CatalogItem:
        entity = self._get_or_404(equipment_id)
        self._apply(entity, data)
        self.uow.commit()
        self.uow.refresh(entity)
        return to_catalog_item(entity)

    def bulk_update(self, rows: list[CatalogItemUpdate]) -> list[CatalogItem]:
        """Сохраняет правки нескольких строк одной транзакцией: при ошибке не сохраняется ничего."""
        updated = []
        for row in rows:
            entity = self.equipment.get(row.id)
            if entity is None:
                raise NotFoundError(f"СИЗ с ID {row.id} не найден")
            self._apply(entity, row)
            updated.append(entity)
        self.uow.commit()
        for entity in updated:
            self.uow.refresh(entity)
        return [to_catalog_item(e) for e in updated]

    def delete(self, equipment_id: int) -> None:
        entity = self._get_or_404(equipment_id)
        reason = self._usage_error(equipment_id)
        if reason:
            raise ConflictError(f"Нельзя удалить «{entity.Name}»: {reason}")
        self.equipment.delete(entity)
        self.uow.commit()

    def bulk_delete(self, ids: list[int]) -> BulkDeleteResult:
        """
        Удаляет выделенные позиции. Уже выданные сотрудникам не удаляются
        (иначе нарушится связь с inventory) — они возвращаются в failed с причиной.
        """
        if not ids:
            raise BadRequestError("Не выбрано ни одной строки")

        deleted: list[int] = []
        failed: list[BulkDeleteFailure] = []
        for equipment_id in dict.fromkeys(ids):  # без дублей, порядок сохраняется
            entity = self.equipment.get(equipment_id)
            if entity is None:
                failed.append(BulkDeleteFailure(id=equipment_id, reason="Не найдено"))
                continue
            reason = self._usage_error(equipment_id)
            if reason:
                failed.append(BulkDeleteFailure(id=equipment_id, name=entity.Name, reason=reason))
                continue
            self.equipment.delete(entity)
            deleted.append(equipment_id)
        self.uow.commit()
        return BulkDeleteResult(deleted=deleted, failed=failed)

    # ---------- правила ----------

    def _get_or_404(self, equipment_id: int) -> models.Equipment:
        entity = self.equipment.get(equipment_id)
        if entity is None:
            raise NotFoundError("Не найдено")
        return entity

    def _apply(self, entity: models.Equipment, data: CatalogItemCreate) -> None:
        entity.Name = self._clean_name(data.name)
        entity.Service_life = self._check_lifespan(data.lifespan_weeks)
        entity.ID_type = self._resolve_type_id(data.type_id, data.type_name)

    @staticmethod
    def _clean_name(raw: Optional[str]) -> str:
        name = (raw or "").strip()
        if not name:
            raise BadRequestError("Название СИЗ не может быть пустым")
        if len(name) > 150:
            raise BadRequestError("Название слишком длинное (максимум 150 символов)")
        return name

    @staticmethod
    def _check_lifespan(weeks: Optional[int]) -> Optional[int]:
        if weeks is not None and weeks <= 0:
            raise BadRequestError("Срок эксплуатации должен быть больше нуля")
        return weeks

    def _resolve_type_id(self, type_id: Optional[int], type_name: Optional[str]) -> Optional[int]:
        """
        type_name -> найти тип (без учёта регистра) или создать новый;
        type_id   -> проверить, что тип существует;
        иначе     -> тип не указан.
        """
        name = (type_name or "").strip()
        if name:
            if len(name) > 100:
                raise BadRequestError("Название типа слишком длинное (максимум 100 символов)")
            existing = self.types.find_by_name(name)
            if existing:
                return existing.ID_type
            new_type = self.types.add(models.EquipmentType(Name=name))
            self.types.flush()  # получить ID_type; commit сделает вызывающий метод
            return new_type.ID_type

        if type_id is not None:
            if self.types.get(type_id) is None:
                raise BadRequestError(f"Тип с ID {type_id} не найден")
            return type_id
        return None

    def _usage_error(self, equipment_id: int) -> Optional[str]:
        used = self.inventory.count_by_equipment(equipment_id)
        if used:
            return f"Выдан сотрудникам ({used} шт.) — сначала удалите выдачи"
        return None
