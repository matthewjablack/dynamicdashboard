from fastapi import APIRouter, HTTPException
from ..services.deribit_service import DeribitService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/futures/{symbol}")
async def get_futures_data(symbol: str):
    """Get futures data for a given symbol."""
    try:
        logger.info(f"Handling request for futures data: {symbol}")
        async with DeribitService() as service:
            data = await service.get_futures_data(symbol)
            return data
    except ValueError as e:
        logger.error(f"Value error in futures data request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching futures data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching futures data")
