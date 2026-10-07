from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/employee", tags=["employee"])


# ---------- СИЗ сотрудника ----------

@router.get("/siz", response_model=list[schemas.EmployeeSizItem])
def get_my_siz(
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    items = db.query(models.Inventory).filter(
        models.Inventory.ID_employee == me.ID_Employee
    ).all()

    result = []
    for item in items:
        status_name = item.status.Status if item.status else None
        result.append(schemas.EmployeeSizItem(
            id=item.ID_inv,
            name=item.equipment.Name if item.equipment else "—",
            type=item.equipment.type.Name if item.equipment and item.equipment.type else None,
            receivedAt=item.Issue_date,
            dueAt=item.Due_date,
            returned=(status_name == models.STATUS_RETURNED),
        ))
    return result


@router.post("/siz/{inv_id}/return")
def return_siz(
    inv_id: int,
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    """Сотрудник отмечает, что сдал конкретный экземпляр СИЗ."""
    item = db.query(models.Inventory).filter(
        models.Inventory.ID_inv == inv_id,
        models.Inventory.ID_employee == me.ID_Employee,
    ).first()
    if item is None:
        raise HTTPException(status_code=404, detail="СИЗ не найден")

    returned_status = db.query(models.Status).filter(
        models.Status.Status == models.STATUS_RETURNED
    ).first()
    if returned_status is None:
        raise HTTPException(status_code=500, detail="В таблице status нет записи 'Сдано'")

    item.ID_status = returned_status.ID_status
    db.commit()
    return {"ok": True}


# ---------- запросы сотрудника ----------

@router.get("/requests", response_model=list[schemas.EmployeeRequestItem])
def get_my_requests(
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    reqs = db.query(models.Request).filter(
        models.Request.ID_Employee == me.ID_Employee
    ).order_by(models.Request.Request_date.desc()).all()

    return [
        schemas.EmployeeRequestItem(
            id=r.ID_req,
            date=r.Request_date,
            status=models.REQUEST_STATUS_RU_TO_CODE.get(r.Status, r.Status),
        )
        for r in reqs
    ]


@router.post("/requests", response_model=schemas.EmployeeRequestItem)
def create_request(
    body: schemas.CreateRequestBody,
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    new_request = models.Request(
        ID_Employee=me.ID_Employee,
        Request_date=datetime.now(),
        Status="Ожидает",
        Comment=body.comment,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return schemas.EmployeeRequestItem(
        id=new_request.ID_req,
        date=new_request.Request_date,
        status="pending",
    )


# ---------- уведомления сотрудника ----------

@router.get("/notifications", response_model=list[schemas.NotificationItem])
def get_my_notifications(
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    notes = db.query(models.Notification).filter(
        models.Notification.ID_Employee == me.ID_Employee,
        models.Notification.Is_cleared == False,  # noqa: E712
    ).order_by(models.Notification.Date_sent.desc()).all()

    return [
        schemas.NotificationItem(
            id=n.ID_notification,
            date=n.Date_sent,
            name=n.inventory.equipment.Name if n.inventory and n.inventory.equipment else "—",
        )
        for n in notes
    ]


@router.post("/notifications/clear")
def clear_my_notifications(
    db: Session = Depends(get_db),
    me: models.Employee = Depends(auth.get_current_employee),
):
    db.query(models.Notification).filter(
        models.Notification.ID_Employee == me.ID_Employee,
    ).update({"Is_cleared": True})
    db.commit()
    return {"ok": True}
