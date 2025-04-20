import ccxt.async_support as ccxt
from typing import List, Dict, Any, Union
from datetime import datetime, timezone
import pandas as pd
import logging

# Set up logging
logger = logging.getLogger(__name__)


def format_time_remaining(days: float) -> str:
    """Format days to expiry as 'XXd YYh ZZm'"""
    total_hours = days * 24
    d = int(total_hours // 24)
    h = int(total_hours % 24)
    m = int((total_hours * 60) % 60)

    if d > 0:
        return f"{d}d {h}h {m}m"
    elif h > 0:
        return f"{h}h {m}m"
    else:
        return f"{m}m"


def calculate_apr(
    perp_price: float, future_price: float, days_to_expiry: float
) -> float:
    """Calculate annualized return rate"""
    if days_to_expiry <= 0 or perp_price <= 0:
        return 0
    return (future_price / perp_price - 1) * (365 / days_to_expiry) * 100


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float with a default."""
    try:
        if value is None:
            return default
        return float(value)
    except (ValueError, TypeError):
        return default


class DeribitService:
    def __init__(self):
        self.exchange = ccxt.deribit(
            {
                "enableRateLimit": True,
            }
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.exchange.close()

    async def get_futures_data(self, symbol: str = "BTC") -> List[Dict[str, Any]]:
        """Get futures data including funding rates and calculate APR."""
        try:
            logger.info(f"Fetching futures data for {symbol}")
            futures = []

            # Get perpetual data first
            perp_symbol = f"{symbol}-PERPETUAL"
            logger.debug(f"Fetching perpetual data for {perp_symbol}")
            perp_ticker = await self.exchange.fetch_ticker(perp_symbol)

            # Get index price from perpetual ticker
            index_price = safe_float(perp_ticker.get("info", {}).get("index_price"))
            perp_price = safe_float(perp_ticker.get("last"))
            mark_price = safe_float(perp_ticker.get("mark", perp_ticker.get("last")))

            # Store perpetual data
            perp_data = {
                "instrument": perp_symbol,
                "bidAmount": safe_float(perp_ticker.get("bidVolume")),
                "bid": safe_float(perp_ticker.get("bid")),
                "mark": mark_price,
                "ask": safe_float(perp_ticker.get("ask")),
                "askAmount": safe_float(perp_ticker.get("askVolume")),
                "low24h": safe_float(perp_ticker.get("low")),
                "high24h": safe_float(perp_ticker.get("high")),
                "change24h": f"{safe_float(perp_ticker.get('percentage')):.2f}%",
                "volume24h": safe_float(perp_ticker.get("quoteVolume")),
                "openInterest": safe_float(
                    perp_ticker.get("info", {}).get("open_interest")
                ),
                "premium": f"{((perp_price / index_price - 1) * 100 if index_price > 0 else 0):+.2f}%",
                "premiumAmount": abs(perp_price - index_price)
                if index_price > 0
                else 0,
                "tenor": "-",
                "apr": "0.00%",
            }
            futures.append(perp_data)

            # Get all fixed-dated futures
            markets = await self.exchange.load_markets()

            for symbol_key, market in markets.items():
                if (
                    market["future"]
                    and not market["option"]
                    and market["id"].startswith(f"{symbol}-")
                    and "PERPETUAL" not in market["id"]
                    and "FS" not in market["id"]  # Filter out futures spreads
                ):
                    try:
                        ticker = await self.exchange.fetch_ticker(market["id"])

                        # Calculate days to expiry
                        expiry_timestamp = market["expiry"]
                        expiry_date = datetime.fromtimestamp(
                            expiry_timestamp / 1000, tz=timezone.utc
                        )
                        now = datetime.now(timezone.utc)
                        days_to_expiry = (expiry_date - now).total_seconds() / (
                            24 * 3600
                        )

                        mark_price = safe_float(ticker.get("mark", ticker.get("last")))

                        # Calculate premium and APR
                        premium_absolute = mark_price - perp_data["mark"]
                        premium_percentage = (
                            (mark_price / perp_data["mark"] - 1) * 100
                            if perp_data["mark"] > 0
                            else 0
                        )
                        apr = calculate_apr(
                            perp_data["mark"], mark_price, days_to_expiry
                        )

                        future_data = {
                            "instrument": market["id"],
                            "bidAmount": safe_float(ticker.get("bidVolume")),
                            "bid": safe_float(ticker.get("bid")),
                            "mark": mark_price,
                            "ask": safe_float(ticker.get("ask")),
                            "askAmount": safe_float(ticker.get("askVolume")),
                            "low24h": safe_float(ticker.get("low")),
                            "high24h": safe_float(ticker.get("high")),
                            "change24h": f"{safe_float(ticker.get('percentage')):.2f}%",
                            "volume24h": safe_float(ticker.get("quoteVolume")),
                            "openInterest": safe_float(
                                ticker.get("info", {}).get("open_interest")
                            ),
                            "premium": f"{premium_percentage:+.2f}%",
                            "premiumAmount": abs(premium_absolute),
                            "tenor": format_time_remaining(days_to_expiry),
                            "apr": f"{apr:+.2f}%",
                        }
                        futures.append(future_data)

                    except Exception as e:
                        logger.error(
                            f"Error fetching data for {market['id']}: {str(e)}"
                        )
                        continue

            # Sort by tenor (ascending) - perpetual first, then nearest expiry to furthest
            return sorted(
                futures,
                key=lambda x: (
                    0
                    if x["instrument"].endswith("PERPETUAL")
                    else 1,  # Put perpetual at the start
                    float(x["tenor"].split("d")[0])
                    if x["tenor"] != "-"
                    else 0,  # Sort by days ascending
                ),
            )

        except Exception as e:
            logger.error(f"Error in get_futures_data: {str(e)}")
            raise

    async def close(self):
        """Close the exchange connection."""
        await self.exchange.close()


# Create a single instance of the service
deribit_service = DeribitService()
