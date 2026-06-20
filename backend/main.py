"""
FinanceFlow BI API – Application Entry Point.

Changes from original:
  - CORS restricted to env-configured origins (no more wildcard *)
  - JWT authentication integrated
  - All new routers registered (auth, budgets, monitoring)
  - APScheduler wired into FastAPI lifespan for automatic ETL runs
  - Structured request logging middleware
  - Database initialized on startup
"""

import logging
import os
import sys
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Ensure the backend directory is on the Python path when run from project root
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from config import get_settings
from database import engine
from orm_models import Base

# Routers
from routers import auth_router, budgets, insights, kpis, monitoring, transactions, trends

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Application Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Runs startup logic before the first request and teardown on shutdown.
    """
    logger.info("Starting FinanceFlow BI API v%s [%s]", settings.app_version, settings.environment)

    # 1. Create all database tables (idempotent – skips existing)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created.")

    # 2. Seed default admin and budget if first run
    _seed_on_startup()

    # 3. Start ETL scheduler
    _start_scheduler()

    yield  # Application runs here

    # Shutdown
    logger.info("FinanceFlow API shutting down.")
    _stop_scheduler()


def _seed_on_startup():
    """Seed default admin user and budget on startup if they don't exist."""
    try:
        from database import SessionLocal
        from orm_models import Budget, User
        from auth import hash_password

        db = SessionLocal()
        try:
            if not db.query(User).filter(User.role == "admin").first():
                admin = User(
                    email=settings.admin_email,
                    hashed_password=hash_password(settings.admin_password),
                    role="admin",
                )
                db.add(admin)
                logger.info("Seeded default admin user: %s", settings.admin_email)

            if not db.query(Budget).filter(Budget.month == "default").first():
                db.add(Budget(month="default", amount=settings.default_budget))
                logger.info("Seeded default budget: $%.2f", settings.default_budget)

            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Startup seeding skipped: %s", exc)


_scheduler = None


def _start_scheduler():
    """Start the APScheduler background ETL job."""
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from etl_runner import run_etl_job

        _scheduler = BackgroundScheduler()
        _scheduler.add_job(
            run_etl_job,
            trigger="cron",
            hour=settings.etl_cron_hour,
            minute=settings.etl_cron_minute,
            id="daily_etl",
            name="Daily ETL Pipeline",
            replace_existing=True,
            misfire_grace_time=300,  # 5 min grace window
        )
        _scheduler.start()
        logger.info(
            "ETL scheduler started – daily at %02d:%02d UTC",
            settings.etl_cron_hour, settings.etl_cron_minute,
        )
    except ImportError:
        logger.warning("APScheduler not available – ETL scheduling disabled.")
    except Exception as exc:
        logger.error("Failed to start ETL scheduler: %s", exc)


def _stop_scheduler():
    """Gracefully stop the APScheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("ETL scheduler stopped.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Enterprise-grade Business Intelligence API for personal finance analytics.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – restricted to configured origins (no more wildcard)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Request Logging Middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with method, path, status, and latency."""
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 1)
    logger.info(
        "%s %s → %d (%.1fms)",
        request.method, request.url.path, response.status_code, duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# API Routers
# ---------------------------------------------------------------------------

API_PREFIX = "/api"

app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(transactions.router, prefix=API_PREFIX)
app.include_router(kpis.router, prefix=API_PREFIX)
app.include_router(insights.router, prefix=API_PREFIX)
app.include_router(trends.router, prefix=API_PREFIX)
app.include_router(budgets.router, prefix=API_PREFIX)
app.include_router(monitoring.router, prefix=API_PREFIX)

# ---------------------------------------------------------------------------
# Static Frontend Serving (monorepo deployment)
# ---------------------------------------------------------------------------

_frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(_frontend_path):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(_frontend_path, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        """Serve the React SPA for all non-API routes (SPA fallback)."""
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found.")
        file_path = os.path.join(_frontend_path, full_path)
        if os.path.isfile(file_path) and full_path:
            return FileResponse(file_path)
        return FileResponse(os.path.join(_frontend_path, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "FinanceFlow BI API is running.",
            "docs": "/docs",
            "version": settings.app_version,
        }
