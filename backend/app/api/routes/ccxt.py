from fastapi import APIRouter, HTTPException
from ..services.ccxt_service import CCXTService
from typing import List, Dict, Optional

router = APIRouter()
ccxt_service = CCXTService()


@router.get("/exchanges")
async def get_available_exchanges() -> List[str]:
    """Get list of available exchanges"""
    try:
        return ccxt_service.get_available_exchanges()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchanges/{exchange_id}/markets")
async def get_exchange_markets(exchange_id: str) -> List[Dict]:
    """Get available markets for an exchange"""
    try:
        return ccxt_service.get_exchange_markets(exchange_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchanges/{exchange_id}/ohlcv")
async def get_ohlcv(
    exchange_id: str,
    symbol: str,
    timeframe: str = "1m",
    since: Optional[int] = None,
    limit: int = 1000,
) -> List[List[float]]:
    """Get OHLCV data for a symbol"""
    try:
        return ccxt_service.get_ohlcv(exchange_id, symbol, timeframe, since, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
