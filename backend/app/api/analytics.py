from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.schemas.analytics import (
    CounterStat,
    HourlyPoint,
    OverviewStats,
    ServiceStat,
    SimulationRequest,
    SimulationResponse,
)
from app.services import analytics_service, simulation_service

router = APIRouter(prefix="/api/admin/analytics", tags=["analytics"], dependencies=[Depends(require_admin)])


@router.get("/overview", response_model=OverviewStats)
def overview(day: date | None = None, db: Session = Depends(get_db)):
    return analytics_service.overview(db, day)


@router.get("/hourly", response_model=list[HourlyPoint])
def hourly(day: date | None = None, db: Session = Depends(get_db)):
    return analytics_service.hourly(db, day)


@router.get("/services", response_model=list[ServiceStat])
def services(days: int = 7, db: Session = Depends(get_db)):
    return analytics_service.service_stats(db, days)


@router.get("/counters", response_model=list[CounterStat])
def counters(days: int = 1, db: Session = Depends(get_db)):
    return analytics_service.counter_stats(db, days)


@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest):
    """What-if planning. Pure arithmetic, no database access needed."""
    return simulation_service.run_simulation(payload)
