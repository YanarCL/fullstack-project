"""
Пример роутера. Здесь показано, как организовывать API по модулям.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/items", tags=["items"])


class Item(BaseModel):
    id: int
    name: str
    description: str | None = None


# Временное хранилище в памяти (замени на реальную БД: PostgreSQL, SQLite и т.д.)
fake_db: list[Item] = [
    Item(id=1, name="Первый элемент", description="Пример данных с backend"),
    Item(id=2, name="Второй элемент", description="Ещё один пример"),
]


@router.get("/", response_model=list[Item])
def get_items():
    return fake_db


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    for item in fake_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item не найден")


@router.post("/", response_model=Item)
def create_item(item: Item):
    fake_db.append(item)
    return item
