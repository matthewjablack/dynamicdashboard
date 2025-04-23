from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from ..services.economic_service import EconomicService
from datetime import datetime

router = APIRouter()
economic_service = EconomicService()


@router.get("/calendar")
async def get_economic_calendar(
    from_date: Optional[str] = None, to_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get economic calendar events"""
    try:
        return await economic_service.get_economic_calendar(from_date, to_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/fomc")
async def get_fomc_meetings() -> List[Dict[str, Any]]:
    """Get upcoming FOMC meetings"""
    try:
        return await economic_service.get_fomc_meetings()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
