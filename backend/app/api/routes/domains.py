from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.services.domain_service import DomainService
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.domain import Domain, DomainType
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class DomainCreate(BaseModel):
    name: str
    type: DomainType


class DomainResponse(BaseModel):
    id: int
    name: str
    type: DomainType
    registrar: Optional[str]
    creation_date: Optional[datetime]
    expiration_date: Optional[datetime]
    status: Optional[str]

    class Config:
        from_attributes = True


@router.post("", response_model=DomainResponse)
def create_domain(
    domain: DomainCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DomainService(db)
    return service.add_domain(domain.name, domain.type, current_user.id)


@router.get("", response_model=List[DomainResponse])
def get_domains(
    domain_type: Optional[DomainType] = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DomainService(db)
    return service.get_domains(current_user.id, domain_type, sort_by, sort_order)


@router.delete("/{domain_id}")
def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DomainService(db)
    if service.delete_domain(domain_id, current_user.id):
        return {"message": "Domain deleted successfully"}
    raise HTTPException(status_code=404, detail="Domain not found")


@router.post("/{domain_id}/refresh", response_model=DomainResponse)
def refresh_domain_info(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = DomainService(db)
    domain = service.update_domain_info(domain_id, current_user.id)
    if domain:
        return domain
    raise HTTPException(status_code=404, detail="Domain not found")
