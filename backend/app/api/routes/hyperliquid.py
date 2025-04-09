from fastapi import APIRouter, HTTPException
from ..services.hyperliquid_service import HyperliquidService
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
hyperliquid_service = HyperliquidService()


@router.get("/candles/{symbol}")
async def get_candles(
    symbol: str, interval: str = "1m", limit: int = 5000
) -> List[Dict[str, Any]]:
    try:
        logger.info(
            f"Received request for candles: symbol={symbol}, interval={interval}, limit={limit}"
        )
        return await hyperliquid_service.get_candles(symbol, interval, limit)
    except ValueError as e:
        logger.error(f"Value error in get_candles: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_candles: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/market-data/{symbol}")
async def get_market_data(symbol: str) -> Dict[str, Any]:
    try:
        logger.info(f"Received request for market data: symbol={symbol}")
        return await hyperliquid_service.get_market_data(symbol)
    except ValueError as e:
        logger.error(f"Value error in get_market_data: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_market_data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/funding-rates/{symbol}")
async def get_funding_rates(symbol: str) -> List[Dict[str, Any]]:
    try:
        logger.info(f"Received request for funding rates: symbol={symbol}")
        return await hyperliquid_service.get_funding_rates(symbol)
    except ValueError as e:
        logger.error(f"Value error in get_funding_rates: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in get_funding_rates: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
