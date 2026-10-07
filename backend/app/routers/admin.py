from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(auth.require_admin)])


# ---------- каталог СИЗ (admin/SizTab) ----------

@router.get("/equipment", response_model=list[schemas.CatalogItem])
def list_equipment(search: str = "", db: Session = Depends(get_db)):
    q = db.query(models.Equipment)
    if search:
        q = q.filter(models.Equipment.Name.ilike(f"%{search}%"))
    items = q.all()
    return [
        schemas.CatalogItem(
            id=e.ID_catalog,
            name=e.Name,
            type=e.type.Name if e.type else None,
            lifespanWeeks=e.Service_life,
        )
        for e in items
    ]


@router.post("/equipment", response_model=schemas.CatalogItem)
def create_equipment(body: schemas.CatalogItemCreate, db: Session = Depends(get_db)):
    e = models.Equipment(Name=body.name, ID_type=body.type_id, Service_life=body.lifespan_weeks)
    db.add(e)
    db.commit()
    db.refresh(e)
    return schemas.CatalogItem(
        id=e.ID_catalog, name=e.Name,
        type=e.type.Name if e.type else None, lifespanWeeks=e.Service_life,
    )


@router.put("/equipment/{equipment_id}", response_model=schemas.CatalogItem)
def update_equipment(equipment_id: int, body: schemas.CatalogItemCreate, db: Session = Depends(get_db)):
    e = db.query(models.Equipment).filter(models.Equipment.ID_catalog == equipment_id).first()
    if e is None:
        raise HTTPException(status_code=404, detail="Не найдено")
    e.Name = body.name
    e.ID_type = body.type_id
    e.Service_life = body.lifespan_weeks
    db.commit()
    return schemas.CatalogItem(
        id=e.ID_catalog, name=e.Name,
        type=e.type.Name if e.type else None, lifespanWeeks=e.Service_life,
    )


@router.delete("/equipment/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    e = db.query(models.Equipment).filter(models.Equipment.ID_catalog == equipment_id).first()
    if e is None:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.delete(e)
    db.commit()
    return {"ok": True}


# ---------- запросы на СИЗ (admin/RequestsTab) ----------

@router.get("/requests", response_model=list[schemas.AdminRequestItem])
def list_requests(db: Session = Depends(get_db)):
    reqs = db.query(models.Request).order_by(models.Request.Request_date.desc()).all()
    return [
        schemas.AdminRequestItem(
            id=r.ID_req,
            employeeId=r.ID_Employee,
            employeeName=r.employee.Name if r.employee else "—",
            shop=r.employee.workshop.WorkShop if r.employee and r.employee.workshop else None,
            status=models.REQUEST_STATUS_RU_TO_CODE.get(r.Status, r.Status),
            comment=r.Comment,
        )
        for r in reqs
    ]


class UpdateRequestStatusBody(BaseModel):
    status: str  # "approved" | "rejected"


@router.patch("/requests/{request_id}", response_model=schemas.AdminRequestItem)
def update_request_status(request_id: int, body: UpdateRequestStatusBody, db: Session = Depends(get_db)):
    r = db.query(models.Request).filter(models.Request.ID_req == request_id).first()
    if r is None:
        raise HTTPException(status_code=404, detail="Запрос не найден")

    ru_status = models.REQUEST_STATUS_CODE_TO_RU.get(body.status)
    if ru_status is None:
        raise HTTPException(status_code=400, detail="Неизвестный статус")

    r.Status = ru_status
    db.commit()
    return schemas.AdminRequestItem(
        id=r.ID_req, employeeId=r.ID_Employee,
        employeeName=r.employee.Name if r.employee else "—",
        shop=r.employee.workshop.WorkShop if r.employee and r.employee.workshop else None,
        status=body.status, comment=r.Comment,
    )


# ---------- выдача СИЗ сотруднику (admin/AddSizTab) ----------

@router.get("/employees/search", response_model=list[schemas.EmployeeSearchResult])
def search_employees(q: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Employee)
    if q:
        query = query.filter(or_(
            models.Employee.Name.ilike(f"%{q}%"),
            models.Employee.Login.ilike(f"%{q}%"),
        ))
    employees = query.limit(20).all()
    return [
        schemas.EmployeeSearchResult(id=e.ID_Employee, name=e.Name, login=e.Login)
        for e in employees
    ]


@router.get("/employees/{employee_id}/siz", response_model=list[schemas.AssignedSizItem])
def get_employee_siz(employee_id: int, db: Session = Depends(get_db)):
    items = db.query(models.Inventory).filter(models.Inventory.ID_employee == employee_id).all()
    return [
        schemas.AssignedSizItem(
            id=i.ID_inv,
            name=i.equipment.Name if i.equipment else "—",
            receivedAt=i.Issue_date,
            dueAt=i.Due_date,
        )
        for i in items
    ]


@router.post("/employees/{employee_id}/siz", response_model=schemas.AssignedSizItem)
def assign_siz(employee_id: int, body: schemas.AssignSizBody, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.ID_Employee == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    issued_status = db.query(models.Status).filter(
        models.Status.Status == models.STATUS_ISSUED
    ).first()
    if issued_status is None:
        raise HTTPException(status_code=500, detail="В таблице status нет записи 'Выдано'")

    item = models.Inventory(
        ID_catalog=body.equipment_id,
        serial_number=body.serial_number,
        ID_status=issued_status.ID_status,
        ID_employee=employee_id,
        Issue_date=date.today(),
        Due_date=body.due_at,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.AssignedSizItem(
        id=item.ID_inv, name=item.equipment.Name if item.equipment else "—",
        receivedAt=item.Issue_date, dueAt=item.Due_date,
    )


@router.delete("/inventory/{inventory_id}")
def delete_inventory(inventory_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Inventory).filter(models.Inventory.ID_inv == inventory_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ---------- контроль просрочек (admin/ControlTab) ----------

@router.get("/control/overdue", response_model=list[schemas.OverdueItem])
def get_overdue(db: Session = Depends(get_db)):
    today = date.today()
    items = db.query(models.Inventory).filter(
        models.Inventory.Due_date.isnot(None),
        models.Inventory.Due_date < today,
    ).all()

    result = []
    for item in items:
        if item.status and item.status.Status == models.STATUS_RETURNED:
            continue  # уже сдано — не просрочка
        if item.employee is None:
            continue
        overdue_days = (today - item.Due_date).days
        result.append(schemas.OverdueItem(
            employeeName=item.employee.Name,
            sizName=item.equipment.Name if item.equipment else "—",
            dueAt=item.Due_date,
            overdueDays=overdue_days,
            inventory_id=item.ID_inv,
            employee_id=item.ID_employee,
        ))
    return result


@router.post("/control/notify-all")
def notify_all_overdue(db: Session = Depends(get_db)):
    overdue_items = get_overdue(db)  # переиспользуем логику выше
    now = datetime.now()
    count = 0
    for item in overdue_items:
        notification = models.Notification(
            ID_Employee=item.employee_id,
            ID_inv=item.inventory_id,
            Date_sent=now,
            Is_cleared=False,
        )
        db.add(notification)
        count += 1
    db.commit()
    return {"notified": count}
