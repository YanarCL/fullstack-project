from datetime import date
from typing import Optional

from pydantic import BaseModel


class EmployeeSizItem(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    receivedAt: Optional[date] = None
    dueAt: Optional[date] = None
    returned: bool


class EmployeeSearchResult(BaseModel):
    id: int
    name: str
    login: str


class AssignedSizItem(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    status: Optional[str] = None
    receivedAt: Optional[date] = None
    dueAt: Optional[date] = None


class AssignSizBody(BaseModel):
    equipment_id: int
    due_at: Optional[date] = None
    issued_at: Optional[date] = None  
