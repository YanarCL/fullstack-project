from typing import Optional


class AppError(Exception):
    status_code = 500

    def __init__(self, detail: str, headers: Optional[dict] = None):
        super().__init__(detail)
        self.detail = detail
        self.headers = headers


class BadRequestError(AppError):
    status_code = 400


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class InternalError(AppError):
    status_code = 500
