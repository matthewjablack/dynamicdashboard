import ccxt
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class HyperliquidService:
    def __init__(self):
        self.exchange = ccxt.hyperliquid(
            {
                "enableRateLimit": True,
            }
        )
        self.exchange.load_markets()
        logger.info("Initialized HyperliquidService with CCXT")

    async def get_candles(
        self, symbol: str, interval: str = "1m", limit: int = 5000
    ) -> List[Dict[str, Any]]:
        """Fetch historical candles from Hyperliquid using CCXT"""
        try:
            # Convert symbol to CCXT format (e.g., "BTC" -> "BTC/USDC:USDC")
            formatted_symbol = f"{symbol.upper()}/USDC:USDC"
            logger.info(f"Fetching candles for {formatted_symbol}")

            # Fetch OHLCV data
            ohlcv = self.exchange.fetch_ohlcv(
                formatted_symbol, timeframe=interval, limit=limit
            )

            # Transform to our expected format
            transformed_data = [
                {
                    "time": candle[0],  # timestamp
                    "open": float(candle[1]),
                    "high": float(candle[2]),
                    "low": float(candle[3]),
                    "close": float(candle[4]),
                    "volume": float(candle[5]),
                }
                for candle in ohlcv
            ]

            logger.info(
                f"Retrieved {len(transformed_data)} candles for {formatted_symbol}"
            )
            return transformed_data

        except Exception as e:
            logger.error(f"Error fetching candles: {str(e)}")
            raise ValueError(f"Failed to fetch candles: {str(e)}")

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Fetch current market data including mark price, funding rate, etc."""
        try:
            formatted_symbol = f"{symbol.upper()}/USDC:USDC"
            logger.info(f"Fetching market data for {formatted_symbol}")

            # Get ticker data
            ticker = self.exchange.fetch_ticker(formatted_symbol)

            # Get funding rate
            funding = self.exchange.fetch_funding_rate(formatted_symbol)

            # Get open interest
            open_interest = self.exchange.fetch_open_interest(formatted_symbol)

            # Get 24h volume from OHLCV data
            ohlcv = self.exchange.fetch_ohlcv(
                formatted_symbol, timeframe="1h", limit=24
            )
            df = pd.DataFrame(
                ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
            )
            total_volume = df["volume"].sum()

            return {
                "dayNtlVlm": str(total_volume),
                "funding": str(funding.get("fundingRate", 0)),
                "markPx": str(ticker["last"]),
                "openInterest": str(open_interest.get("openInterest", 0)),
                "oraclePx": str(ticker.get("info", {}).get("oraclePx", ticker["last"])),
                "premium": str(funding.get("premium", 0)),
            }

        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            raise ValueError(f"Failed to fetch market data: {str(e)}")

    async def get_funding_rates(self, symbol: str) -> List[Dict[str, Any]]:
        """Fetch historical funding rates"""
        try:
            formatted_symbol = f"{symbol.upper()}/USDC:USDC"
            logger.info(f"Fetching funding rates for {formatted_symbol}")

            # Get funding rate history
            funding_history = self.exchange.fetch_funding_rate_history(
                formatted_symbol,
                since=int((datetime.now() - timedelta(days=30)).timestamp() * 1000),
                limit=1000,
            )

            return funding_history

        except Exception as e:
            logger.error(f"Error fetching funding rates: {str(e)}")
            raise ValueError(f"Failed to fetch funding rates: {str(e)}")
