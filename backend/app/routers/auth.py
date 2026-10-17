from fastapi import APIRouter, Depends

from ..dependencies import get_auth_service
from ..dto.auth import LoginRequest, LoginResponse
from ..services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login(body)
