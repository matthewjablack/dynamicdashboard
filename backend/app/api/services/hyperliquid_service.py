import httpx
from typing import List, Dict, Any
import asyncio
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class HyperliquidService:
    BASE_URL = "https://api.hyperliquid.xyz/info"

    async def get_candles(
        self, symbol: str, interval: str = "1m", limit: int = 5000
    ) -> List[Dict[str, Any]]:
        """Fetch historical candles from Hyperliquid"""
        # Calculate start time (current time - interval * limit)
        end_time = int(datetime.now().timestamp() * 1000)

        request_data = {
            "type": "candleSnapshot",
            "req": {
                "coin": symbol.upper(),
                "interval": interval,
                "startTime": end_time
                - (limit * 60 * 1000),  # Convert limit to milliseconds
            },
        }
        logger.info(f"Fetching candles with params: {request_data}")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.BASE_URL,
                    json=request_data,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0,
                )
                logger.info(f"Raw response status: {response.status_code}")
                logger.info(f"Raw response headers: {response.headers}")
                logger.info(f"Raw response text: {response.text[:1000]}...")

                response.raise_for_status()
                data = response.json()

                # Extract candles from the response
                if data and isinstance(data, list) and len(data) > 0:
                    if isinstance(data[0], list):
                        candles = data[0]
                    elif isinstance(data[0], dict):
                        candles = data
                    else:
                        candles = []
                else:
                    candles = []

                if not candles:
                    logger.warning("No candles found in response")
                    return []

                # Transform the data into the expected format
                transformed_data = [
                    {
                        "time": candle["t"],
                        "open": float(candle["o"]),
                        "high": float(candle["h"]),
                        "low": float(candle["l"]),
                        "close": float(candle["c"]),
                        "volume": float(candle["v"]),
                    }
                    for candle in candles
                ]

                logger.info(
                    f"Transformed first candle: {transformed_data[0] if transformed_data else 'No data'}"
                )
                return transformed_data
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP error from Hyperliquid API: {e.response.status_code} - {e.response.text}"
                )
                raise ValueError(f"Error from Hyperliquid API: {e.response.text}")
            except httpx.RequestError as e:
                logger.error(f"Request error to Hyperliquid API: {str(e)}")
                raise ValueError(f"Failed to connect to Hyperliquid API: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error fetching candles: {str(e)}")
                raise ValueError(f"Unexpected error: {str(e)}")

    async def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Fetch current market data including mark price, funding rate, etc."""
        async with httpx.AsyncClient() as client:
            try:
                request_data = {"type": "metaAndAssetCtxs"}

                response = await client.post(
                    self.BASE_URL,
                    json=request_data,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()

                logger.info(f"Received market data response: {data[:100]}...")

                # Extract market data from the response
                if len(data) >= 2:
                    universe = data[0].get("universe", [])
                    asset_contexts = data[1]

                    # Find the index of the requested symbol in the universe
                    symbol_upper = symbol.upper()
                    symbol_index = None

                    for idx, asset_info in enumerate(universe):
                        if asset_info.get("name") == symbol_upper:
                            symbol_index = idx
                            break

                    # If we found the symbol and the index is valid for asset_contexts
                    if symbol_index is not None and symbol_index < len(asset_contexts):
                        asset = asset_contexts[symbol_index]

                        # Safe conversion to float
                        def safe_float(value, default=0.0):
                            try:
                                return float(value) if value is not None else default
                            except (ValueError, TypeError):
                                return default

                        # Get previous day price for calculating change
                        mark_price = safe_float(asset.get("markPx"))
                        oracle_price = safe_float(asset.get("oraclePx"))

                        return {
                            "dayNtlVlm": asset.get("dayNtlVlm", "0"),
                            "funding": asset.get("funding", "0"),
                            "markPx": str(mark_price),
                            "openInterest": asset.get("openInterest", "0"),
                            "oraclePx": str(oracle_price),
                            "premium": asset.get("premium", "0"),
                        }

                logger.warning(f"No market data found for symbol: {symbol}")
                return {}
            except Exception as e:
                logger.error(f"Error fetching market data: {str(e)}")
                raise ValueError(f"Failed to fetch market data: {str(e)}")

    async def get_funding_rates(self, symbol: str) -> List[Dict[str, Any]]:
        """Fetch historical funding rates"""
        end_time = int(datetime.now().timestamp() * 1000)
        start_time = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)

        async with httpx.AsyncClient() as client:
            try:
                request_data = {
                    "type": "fundingHistory",
                    "coin": symbol.upper(),
                    "startTime": start_time,
                    "endTime": end_time,
                }

                response = await client.post(
                    self.BASE_URL,
                    json=request_data,
                    headers={"Content-Type": "application/json"},
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error fetching funding rates: {str(e)}")
                raise ValueError(f"Failed to fetch funding rates: {str(e)}")
