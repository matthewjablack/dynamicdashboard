from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.models.dashboard import Dashboard
from app.models.user import User
from app.core.auth import get_current_active_user
from pydantic import BaseModel, Field

router = APIRouter()


class DashboardComponent(BaseModel):
    id: str = Field(None)
    type: str
    props: Dict[str, Any]
    layout: Dict[str, Any] = Field(None)


class DashboardCreate(BaseModel):
    name: str
    components: List[DashboardComponent]
    layouts: Dict[str, List[Dict[str, Any]]]


class DashboardResponse(BaseModel):
    id: int
    name: str
    components: List[DashboardComponent]
    layouts: Dict[str, List[Dict[str, Any]]]


@router.post("/", response_model=DashboardResponse)
async def create_dashboard(
    dashboard: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new dashboard for the current user"""
    db_dashboard = Dashboard(
        name=dashboard.name,
        components=dashboard.components.dict() if dashboard.components else [],
        layouts=dashboard.layouts,
        user_id=current_user.id,
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a dashboard by ID"""
    dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.id == dashboard_id, Dashboard.user_id == current_user.id)
        .first()
    )
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard


@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """List all dashboards for the current user"""
    return (
        db.query(Dashboard)
        .filter(Dashboard.user_id == current_user.id)
        .order_by(Dashboard.created_at.desc())
        .all()
    )


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: int,
    dashboard_update: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a dashboard"""
    db_dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.id == dashboard_id, Dashboard.user_id == current_user.id)
        .first()
    )
    if not db_dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    # Convert components to dict while preserving all properties
    components_data = []
    if dashboard_update.components:
        for comp in dashboard_update.components:
            comp_dict = {
                "id": comp.id,
                "type": comp.type,
                "props": comp.props,
                "layout": comp.layout,
            }
            components_data.append(comp_dict)

    db_dashboard.name = dashboard_update.name
    db_dashboard.components = components_data
    db_dashboard.layouts = dashboard_update.layouts

    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard


@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a dashboard"""
    db_dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.id == dashboard_id, Dashboard.user_id == current_user.id)
        .first()
    )
    if not db_dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    db.delete(db_dashboard)
    db.commit()
    return {"message": "Dashboard deleted successfully"}
