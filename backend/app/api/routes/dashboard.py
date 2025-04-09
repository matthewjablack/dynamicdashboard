from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()


class DashboardComponent(BaseModel):
    type: str
    config: Dict[str, Any]


class Dashboard(BaseModel):
    name: str
    components: List[DashboardComponent]


# In-memory storage for demo purposes
dashboards: Dict[str, Dashboard] = {}


@router.post("/")
async def create_dashboard(dashboard: Dashboard):
    """Create a new dashboard"""
    dashboards[dashboard.name] = dashboard
    return {"message": f"Dashboard {dashboard.name} created successfully"}


@router.get("/{name}")
async def get_dashboard(name: str):
    """Get a dashboard by name"""
    if name not in dashboards:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboards[name]


@router.get("/")
async def list_dashboards():
    """List all dashboards"""
    return {"dashboards": list(dashboards.keys())}
