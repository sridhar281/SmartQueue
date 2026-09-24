from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models import Service
from app.schemas.service import ServiceCreate, ServiceOut, ServicePublic, ServiceUpdate
from app.services import waiting_time_service

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=list[ServicePublic])
def list_services(include_inactive: bool = False, db: Session = Depends(get_db)):
    """Public list, enriched with live queue length and estimated wait."""
    query = select(Service).order_by(Service.name)
    if not include_inactive:
        query = query.where(Service.active.is_(True))

    result = []
    for service in db.scalars(query).all():
        waiting = waiting_time_service.people_waiting(db, service.id)
        result.append(
            ServicePublic(
                **ServiceOut.model_validate(service).model_dump(),
                waiting_count=waiting,
                estimated_wait_minutes=waiting_time_service.estimate_wait_minutes(db, service, waiting),
                average_service_minutes=int(waiting_time_service.average_service_minutes(db, service)),
            )
        )
    return result


@router.post("", response_model=ServiceOut, status_code=201, dependencies=[Depends(require_admin)])
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Service).where(Service.name == payload.name)):
        raise HTTPException(409, "A service with this name already exists.")
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.patch("/{service_id}", response_model=ServiceOut, dependencies=[Depends(require_admin)])
def update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Service not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", response_model=ServiceOut, dependencies=[Depends(require_admin)])
def deactivate_service(service_id: int, db: Session = Depends(get_db)):
    """Soft delete. Historical tokens must keep pointing at a real service row."""
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Service not found.")
    service.active = False
    db.commit()
    db.refresh(service)
    return service
