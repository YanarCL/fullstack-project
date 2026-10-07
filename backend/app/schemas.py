from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# ---------- auth ----------

class LoginRequest(BaseModel):
    login: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    employee_id: int
    name: str


# ---------- СИЗ сотрудника (employee/SizTab) ----------

class EmployeeSizItem(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    receivedAt: Optional[date] = None
    dueAt: Optional[date] = None
    returned: bool


# ---------- запросы сотрудника (employee/RequestsTab) ----------

class EmployeeRequestItem(BaseModel):
    id: int
    date: datetime
    status: str  # "pending" | "approved" | "rejected"


class CreateRequestBody(BaseModel):
    comment: Optional[str] = None


# ---------- уведомления (employee/NotificationsTab) ----------

class NotificationItem(BaseModel):
    id: int
    date: datetime
    name: str


# ---------- СИЗ-каталог (admin/SizTab) ----------

class CatalogItem(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    lifespanWeeks: Optional[int] = None


class CatalogItemCreate(BaseModel):
    name: str
    type_id: Optional[int] = None
    lifespan_weeks: Optional[int] = None


# ---------- запросы, видимые админу (admin/RequestsTab) ----------

class AdminRequestItem(BaseModel):
    id: int
    employeeId: int
    employeeName: str
    shop: Optional[str] = None
    status: str
    comment: Optional[str] = None


# ---------- выдача СИЗ сотруднику (admin/AddSizTab) ----------

class EmployeeSearchResult(BaseModel):
    id: int
    name: str
    login: str


class AssignedSizItem(BaseModel):
    id: int
    name: str
    receivedAt: Optional[date] = None
    dueAt: Optional[date] = None


class AssignSizBody(BaseModel):
    equipment_id: int
    due_at: Optional[date] = None
    serial_number: Optional[str] = None


# ---------- контроль просрочек (admin/ControlTab) ----------

class OverdueItem(BaseModel):
    employeeName: str
    sizName: str
    dueAt: date
    overdueDays: int
    inventory_id: int
    employee_id: int
