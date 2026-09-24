"""SmartQueue API entrypoint."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin_queue, analytics, appointments, auth, counters, queue, services, ws
from app.core.config import settings
from app.core.database import Base, engine
from app.models import *  # noqa: F401,F403  -- import models so Base knows the tables

logger = logging.getLogger("smartqueue")

app = FastAPI(
    title="SmartQueue API",
    description="Real-time digital queue and appointment management.",
    version="1.0.0",
)

# Only the configured frontend origin may call the API from a browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Fine for this project. A production deployment uses Alembic migrations
    # (see alembic/) instead, so schema changes are versioned and reviewable.
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Error handling: every failure returns the same JSON shape, never a traceback.
# ---------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "message": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(p) for p in first.get("loc", [])[1:]) or "input"
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": f"{field}: {first.get('msg', 'is invalid')}"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log the real error for us; show the user something safe.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Something went wrong. Please try again."},
    )


app.include_router(auth.router)
app.include_router(services.router)
app.include_router(queue.router)
app.include_router(admin_queue.router)
app.include_router(counters.router)
app.include_router(appointments.router)
app.include_router(analytics.router)
app.include_router(ws.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
