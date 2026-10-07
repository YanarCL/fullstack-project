"""
Точка входа backend-приложения на FastAPI.
Запуск (dev): uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, employee, admin

app = FastAPI(
    title="SIZ Tracker API",
    description="Backend на Python (FastAPI) + MySQL для учёта СИЗ",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Backend работает. Открой /docs для Swagger UI."}
