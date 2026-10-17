from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EmployeeRequestItem(BaseModel):
    id: int
    date: datetime
    status: str  


class CreateRequestBody(BaseModel):
    comment: Optional[str] = None


class AdminRequestItem(BaseModel):
    id: int
    employeeId: int
    employeeName: str
    shop: Optional[str] = None
    status: str
    comment: Optional[str] = None


class UpdateRequestStatusBody(BaseModel):
    status: str 
