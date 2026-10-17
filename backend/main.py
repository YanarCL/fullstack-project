
import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.cleanup import cleanup_loop
from app.error_handlers import register_error_handlers
from app.routers import admin_catalog, admin_control, admin_inventory, admin_requests, auth, employee

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_loop())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


app = FastAPI(
    title="SIZ Tracker API",
    description="Backend на Python (FastAPI) + MySQL для учёта СИЗ",
    version="0.2.0",
    lifespan=lifespan,
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

register_error_handlers(app)

app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(admin_catalog.router)
app.include_router(admin_requests.router)
app.include_router(admin_inventory.router)
app.include_router(admin_control.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Backend работает. Открой /docs для Swagger UI."}
