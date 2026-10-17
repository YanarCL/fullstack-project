from typing import Optional
from sqlalchemy import or_
from ..models import Employee
from .base import BaseRepository

class EmployeeRepository(BaseRepository[Employee]):
    model = Employee

    def get_by_login(self, login: str) -> Optional[Employee]:
        return self.db.query(Employee).filter(Employee.Login == login).first()

    def list_all(self) -> list[Employee]:
        return self.db.query(Employee).order_by(Employee.ID_Employee).all()

    def search(self, text: str, limit: int = 20) -> list[Employee]:
        query = self.db.query(Employee)
        if text:
            query = query.filter(or_(
                Employee.Name.ilike(f"%{text}%"),
                Employee.Login.ilike(f"%{text}%"),
            ))
        return query.limit(limit).all()
