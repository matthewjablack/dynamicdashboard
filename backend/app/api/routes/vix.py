from fastapi import APIRouter, HTTPException
from ..services.vix_service import VIXService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def get_vix_data():
    """Get VIX data including current value and historical data."""
    try:
        logger.info("Handling request for VIX data")
        async with VIXService() as service:
            data = await service.get_vix_data()
            return data
    except ValueError as e:
        logger.error(f"Value error in VIX data request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching VIX data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching VIX data")
