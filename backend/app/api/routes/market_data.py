from fastapi import APIRouter, Depends
from app.api.services.market_data_service import MarketDataService

router = APIRouter()
market_data_service = MarketDataService()


@router.get("/prices")
async def get_prices(symbols: str, currency: str = "CAD"):
    """Get current prices for given symbols"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    prices = await market_data_service.get_current_prices(symbol_list, currency)
    return {"prices": prices}


@router.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str, timeframe: str = "1d", limit: int = 100, currency: str = "CAD"
):
    """Get historical OHLCV data for a symbol"""
    data = await market_data_service.get_historical_data(
        symbol, timeframe, limit, currency
    )
    return {"data": data}


@router.get("/indicators/{symbol}")
async def get_technical_indicators(
    symbol: str, timeframe: str = "1d", limit: int = 100
):
    """Get technical indicators for a symbol"""
    indicators = await market_data_service.get_technical_indicators(
        symbol, timeframe, limit
    )
    return {"indicators": indicators}
