"""
ORM-модели — один в один повторяют ER-диаграмму (workshop, employee,
notifications, inventory, status, requests, requests_items, equipment, type).
"""
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship
from .database import Base

ROLE_VALUES = ("admin", "employee")
REQUEST_STATUS_VALUES = ("Ожидает", "Одобрено", "Отклонено")

# Фронтенд (status-pending/approved/rejected в CSS и STATUS_LABELS) ждёт
# английские коды, а в БД статус хранится по-русски — сопоставляем их здесь.
REQUEST_STATUS_RU_TO_CODE = {
    "Ожидает": "pending",
    "Одобрено": "approved",
    "Отклонено": "rejected",
}
REQUEST_STATUS_CODE_TO_RU = {v: k for k, v in REQUEST_STATUS_RU_TO_CODE.items()}

STATUS_ISSUED = "Выдано"
STATUS_RETURNED = "Сдано"


class Workshop(Base):
    __tablename__ = "workshop"

    ID_WorkShop = Column(Integer, primary_key=True, autoincrement=True)
    WorkShop = Column(String(100), nullable=False)

    employees = relationship("Employee", back_populates="workshop")


class Employee(Base):
    __tablename__ = "employee"

    ID_Employee = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(150), nullable=False)
    ID_WorkShop = Column(Integer, ForeignKey("workshop.ID_WorkShop"), nullable=True)
    Login = Column(String(50), nullable=False, unique=True)
    Password = Column(String(255), nullable=False)  # хранится bcrypt-хэш
    Role = Column(Enum(*ROLE_VALUES, name="role_enum"), nullable=False, default="employee")

    workshop = relationship("Workshop", back_populates="employees")
    inventory_items = relationship("Inventory", back_populates="employee")
    requests = relationship("Request", back_populates="employee")
    notifications = relationship("Notification", back_populates="employee")


class EquipmentType(Base):
    __tablename__ = "type"

    ID_type = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), nullable=False)

    equipment = relationship("Equipment", back_populates="type")


class Equipment(Base):
    """Каталог видов СИЗ (справочник)."""
    __tablename__ = "equipment"

    ID_catalog = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(150), nullable=False)
    ID_type = Column(Integer, ForeignKey("type.ID_type"), nullable=True)
    Service_life = Column(Integer, nullable=True)  # срок эксплуатации, недель

    type = relationship("EquipmentType", back_populates="equipment")
    inventory_items = relationship("Inventory", back_populates="equipment")


class Status(Base):
    """Статус конкретного экземпляра СИЗ (напр. 'Выдано' / 'Сдано')."""
    __tablename__ = "status"

    ID_status = Column(Integer, primary_key=True, autoincrement=True)
    Status = Column(String(50), nullable=False)

    inventory_items = relationship("Inventory", back_populates="status")


class Inventory(Base):
    """Конкретный экземпляр СИЗ, выданный (или выдаваемый) сотруднику."""
    __tablename__ = "inventory"

    ID_inv = Column(Integer, primary_key=True, autoincrement=True)
    ID_catalog = Column(Integer, ForeignKey("equipment.ID_catalog"), nullable=False)
    serial_number = Column(String(100), nullable=True)
    ID_status = Column(Integer, ForeignKey("status.ID_status"), nullable=True)
    ID_employee = Column(Integer, ForeignKey("employee.ID_Employee"), nullable=True)
    Issue_date = Column(Date, nullable=True)
    Due_date = Column(Date, nullable=True)

    equipment = relationship("Equipment", back_populates="inventory_items")
    status = relationship("Status", back_populates="inventory_items")
    employee = relationship("Employee", back_populates="inventory_items")


class Request(Base):
    __tablename__ = "requests"

    ID_req = Column(Integer, primary_key=True, autoincrement=True)
    ID_Employee = Column(Integer, ForeignKey("employee.ID_Employee"), nullable=False)
    Request_date = Column(DateTime, nullable=False)
    Status = Column(Enum(*REQUEST_STATUS_VALUES, name="request_status_enum"),
                     nullable=False, default="Ожидает")
    Comment = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="requests")
    items = relationship("RequestItem", back_populates="request")


class RequestItem(Base):
    # имя таблицы и PK сохранены как в исходной ER-диаграмме (requests_items / ID_req_itmes)
    __tablename__ = "requests_items"

    ID_req_itmes = Column(Integer, primary_key=True, autoincrement=True)
    ID_req = Column(Integer, ForeignKey("requests.ID_req"), nullable=False)
    ID_inv_old = Column(Integer, ForeignKey("inventory.ID_inv"), nullable=True)
    ID_inv_new = Column(Integer, ForeignKey("inventory.ID_inv"), nullable=True)

    request = relationship("Request", back_populates="items")


class Notification(Base):
    __tablename__ = "notifications"

    ID_notification = Column(Integer, primary_key=True, autoincrement=True)
    ID_Employee = Column(Integer, ForeignKey("employee.ID_Employee"), nullable=False)
    ID_inv = Column(Integer, ForeignKey("inventory.ID_inv"), nullable=False)
    Date_sent = Column(DateTime, nullable=False)
    Is_cleared = Column(Boolean, nullable=False, default=False)

    employee = relationship("Employee", back_populates="notifications")
    inventory = relationship("Inventory")
