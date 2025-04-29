import ccxt
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import asyncio
import ccxt.async_support as ccxt_async
import logging

logger = logging.getLogger(__name__)


class CCXTService:
    def __init__(self):
        self.exchanges: Dict[str, ccxt.Exchange] = {}
        self.async_exchanges: Dict[str, ccxt_async.Exchange] = {}

    def get_exchange(self, exchange_id: str) -> ccxt.Exchange:
        """Get or create an exchange instance"""
        if exchange_id not in self.exchanges:
            exchange_class = getattr(ccxt, exchange_id)
            self.exchanges[exchange_id] = exchange_class()
        return self.exchanges[exchange_id]

    async def get_async_exchange(self, exchange_id: str) -> ccxt_async.Exchange:
        """Get or create an async exchange instance"""
        try:
            if exchange_id not in self.async_exchanges:
                logger.info(f"Creating new async exchange instance for {exchange_id}")
                if not hasattr(ccxt_async, exchange_id):
                    available_exchanges = dir(ccxt_async)
                    logger.error(
                        f"Exchange {exchange_id} not found in CCXT. Available exchanges: {available_exchanges}"
                    )
                    raise Exception(f"Exchange {exchange_id} not supported")

                exchange_class = getattr(ccxt_async, exchange_id)
                logger.info(f"Initializing {exchange_id} with rate limiting enabled")
                self.async_exchanges[exchange_id] = exchange_class(
                    {
                        "enableRateLimit": True,
                    }
                )
            return self.async_exchanges[exchange_id]
        except Exception as e:
            logger.error(
                f"Error creating exchange instance for {exchange_id}: {str(e)}",
                exc_info=True,
            )
            raise

    async def fetch_perpetual_data(self, exchange_id: str, symbol: str) -> Dict:
        """Fetch perpetual swap data for a single exchange and symbol"""
        exchange = None
        try:
            logger.info(f"Fetching perpetual data for {exchange_id} {symbol}")
            exchange = await self.get_async_exchange(exchange_id)

            # Check if exchange supports perpetual swaps
            if not hasattr(exchange, "has"):
                raise Exception(
                    f"Exchange {exchange_id} does not provide capability information"
                )

            if not exchange.has.get("fetchTicker"):
                raise Exception(
                    f"Exchange {exchange_id} does not support ticker fetching"
                )

            # Fetch ticker data
            try:
                ticker = await exchange.fetch_ticker(symbol)
                if not ticker:
                    raise Exception(
                        f"No ticker data returned for {exchange_id} {symbol}"
                    )
            except Exception as e:
                logger.error(
                    f"Error fetching ticker for {exchange_id} {symbol}: {str(e)}"
                )
                raise Exception(f"Failed to fetch ticker: {str(e)}")

            # Default values
            funding_rate = None
            next_funding_time = None
            mark_price = ticker.get("last")
            index_price = ticker.get(
                "index", mark_price
            )  # Fall back to mark price if no index price

            # Fetch funding rate
            try:
                if hasattr(exchange, "fetch_funding_rate"):
                    funding_info = await exchange.fetch_funding_rate(symbol)
                    funding_rate = funding_info.get("fundingRate")
                    next_funding_time = funding_info.get("nextFundingTime")
                elif "fetchFundingRate" in exchange.has:
                    funding_info = await exchange.fetchFundingRate(symbol)
                    funding_rate = funding_info.get("fundingRate")
                    next_funding_time = funding_info.get("nextFundingTime")
            except Exception as e:
                logger.warning(
                    f"Error fetching funding rate for {exchange_id} {symbol}: {str(e)}"
                )
                # Continue without funding rate data

            # Format next funding time
            try:
                if next_funding_time:
                    next_funding_time = datetime.fromtimestamp(
                        next_funding_time / 1000
                    ).strftime("%H:%M:%S")
            except Exception as e:
                logger.warning(
                    f"Error formatting funding time for {exchange_id} {symbol}: {str(e)}"
                )
                next_funding_time = None

            data = {
                "exchange": exchange_id,
                "symbol": symbol,
                "markPrice": mark_price,
                "indexPrice": index_price,
                "fundingRate": funding_rate,
                "nextFundingTime": next_funding_time,
                "volume24h": ticker.get("quoteVolume"),
                "openInterest": ticker.get("info", {}).get("openInterest"),
            }
            logger.info(f"Successfully fetched data for {exchange_id} {symbol}")
            return data
        except Exception as e:
            logger.error(
                f"Error fetching data for {exchange_id} {symbol}: {str(e)}",
                exc_info=True,
            )
            raise  # Re-raise the exception instead of returning None
        finally:
            if exchange and exchange_id in self.async_exchanges:
                try:
                    await exchange.close()
                except Exception as e:
                    logger.warning(
                        f"Error closing exchange connection for {exchange_id}: {str(e)}"
                    )
                del self.async_exchanges[exchange_id]

    async def get_perpetual_swaps(
        self, exchanges: List[str], symbols: List[str]
    ) -> List[Dict]:
        """Get perpetual swap data for multiple exchanges and symbols"""
        logger.info(
            f"Fetching perpetual swaps for exchanges: {exchanges}, symbols: {symbols}"
        )
        tasks = []
        for exchange in exchanges:
            for symbol in symbols:
                tasks.append(self.fetch_perpetual_data(exchange, symbol))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        valid_results = []
        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Task error in get_perpetual_swaps: {str(r)}")
            elif r is not None:
                valid_results.append(r)

        return valid_results

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
