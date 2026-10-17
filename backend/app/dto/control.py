from datetime import date

from pydantic import BaseModel


class OverdueItem(BaseModel):
    employeeName: str
    sizName: str
    dueAt: date
    overdueDays: int
    inventory_id: int
    employee_id: int
