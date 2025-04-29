from fastapi import APIRouter, HTTPException, Query
from ..services.ccxt_service import CCXTService
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)
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


@router.get("/perpetual-swaps")
async def get_perpetual_swaps(
    exchanges: str = Query(default="binance,okx,bybit"),
    symbols: str = Query(default="BTC/USDT:USDT,ETH/USDT:USDT"),
):
    """
    Get perpetual swap data for specified exchanges and symbols
    """
    try:
        logger.info(
            f"Received request for perpetual swaps with raw params - exchanges: {exchanges}, symbols: {symbols}"
        )

        # Split comma-separated strings into lists
        exchange_list = [x.strip() for x in exchanges.split(",") if x.strip()]
        symbol_list = [x.strip() for x in symbols.split(",") if x.strip()]

        logger.info(
            f"Processing perpetual swaps request for exchanges: {exchange_list}, symbols: {symbol_list}"
        )

        if not exchange_list or not symbol_list:
            logger.warning("No valid exchanges or symbols provided in request")
            raise HTTPException(
                status_code=400, detail="No valid exchanges or symbols provided"
            )

        logger.info("Calling CCXT service to fetch perpetual swaps data...")
        data = await ccxt_service.get_perpetual_swaps(exchange_list, symbol_list)

        if not data:
            logger.warning("No perpetual swap data returned from CCXT service")
            return {"data": []}

        logger.info(f"Successfully fetched perpetual swap data for {len(data)} pairs")
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_perpetual_swaps endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
