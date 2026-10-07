from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(
        models.Employee.Login == body.login
    ).first()

    if employee is None or not auth.verify_password(body.password, employee.Password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = auth.create_access_token({
        "sub": str(employee.ID_Employee),
        "role": employee.Role,
    })

    return schemas.LoginResponse(
        access_token=token,
        role=employee.Role,
        employee_id=employee.ID_Employee,
        name=employee.Name,
    )
