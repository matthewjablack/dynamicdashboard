import ccxt
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class CCXTService:
    def __init__(self):
        self.exchanges: Dict[str, ccxt.Exchange] = {}

    def get_exchange(self, exchange_id: str) -> ccxt.Exchange:
        """Get or create an exchange instance"""
        if exchange_id not in self.exchanges:
            exchange_class = getattr(ccxt, exchange_id)
            self.exchanges[exchange_id] = exchange_class()
        return self.exchanges[exchange_id]

    def get_ohlcv(
        self,
        exchange_id: str,
        symbol: str,
        timeframe: str = "1m",
        since: Optional[int] = None,
        limit: int = 1000,
    ) -> List[List[float]]:
        """Get OHLCV data for a symbol"""
        exchange = self.get_exchange(exchange_id)

        if since is None:
            # Default to last 24 hours if since is not provided
            since = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)

        try:
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since, limit)
            return ohlcv
        except Exception as e:
            raise Exception(f"Error fetching OHLCV data: {str(e)}")

    def get_available_exchanges(self) -> List[str]:
        """Get list of available exchanges"""
        return ccxt.exchanges

    def get_exchange_markets(self, exchange_id: str) -> List[Dict]:
        """Get available markets for an exchange"""
        exchange = self.get_exchange(exchange_id)
        try:
            markets = exchange.load_markets()
            return [
                {
                    "symbol": symbol,
                    "base": market["base"],
                    "quote": market["quote"],
                    "active": market["active"],
                }
                for symbol, market in markets.items()
                if market["active"]  # Only return active markets
            ]
        except Exception as e:
            raise Exception(f"Error loading markets: {str(e)}")
