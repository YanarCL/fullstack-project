from pydantic import BaseModel


class LoginRequest(BaseModel):
    login: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    employee_id: int
    name: str


class CurrentUser(BaseModel):
    id: int
    name: str
    role: str
