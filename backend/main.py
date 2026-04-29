from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)

from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

from routers import auth_router, campaigns, copy_router, audiences, assets
from routers.integrations import router as integrations_router
from routers.alerts import router as alerts_router
from routers.analytics import router as analytics_router
from services.scheduler_service import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        start_scheduler()
        print("✅ Smarketing scheduler started")
    except ImportError:
        print("⚠️  APScheduler not installed — background tasks disabled")
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="Smarketing API",
    description="מערכת שיווק חכמה — קמפיינים, קופי AI, קהלים, אופטימיזציה אוטומטית",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(campaigns.router)
app.include_router(copy_router.router)
app.include_router(audiences.router)
app.include_router(assets.router)
app.include_router(integrations_router)
app.include_router(alerts_router)
app.include_router(analytics_router)

upload_dir = os.getenv("UPLOAD_DIR", "uploads/assets")
os.makedirs(upload_dir, exist_ok=True)
os.makedirs(os.getenv("EXPORT_DIR", "exports"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {
        "app": "Smarketing",
        "version": "2.0.0",
        "status": "running",
        "features": ["campaigns", "ai-copy", "audiences", "assets", "integrations", "auto-optimization", "health-monitoring"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}
