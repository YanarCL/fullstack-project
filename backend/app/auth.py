"""
Аутентификация: хэширование паролей (bcrypt) + JWT-токены.
"""
import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from . import models

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-.env-to-something-random")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 часов

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)





def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Employee:
    """Достаёт текущего сотрудника из JWT-токена (Authorization: Bearer ...)."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учётные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_error
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id = payload.get("sub")
        if employee_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    employee = db.query(models.Employee).filter(
        models.Employee.ID_Employee == int(employee_id)
    ).first()
    if employee is None:
        raise credentials_error
    return employee


def require_admin(employee: models.Employee = Depends(get_current_employee)) -> models.Employee:
    """Dependency для эндпоинтов, доступных только роли admin."""
    if employee.Role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав (нужна роль admin)")
    return employee
