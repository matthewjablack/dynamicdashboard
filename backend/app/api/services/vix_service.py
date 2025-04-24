import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def clean_float(value: float) -> float:
    """Clean float values to ensure they are JSON serializable."""
    if pd.isna(value) or np.isinf(value) or np.isnan(value):
        return 0.0
    return round(float(value), 2)


class VIXService:
    def __init__(self):
        self.symbol = "^VIX"

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def get_vix_data(self) -> Dict[str, Any]:
        """Get VIX data including current value and historical data."""
        try:
            logger.info("Fetching VIX data")
            vix = yf.Ticker(self.symbol)

            # Get current data
            current_data = vix.history(period="1d")
            if current_data.empty:
                raise ValueError("No VIX data available")

            # Get historical data for the last 30 days
            historical_data = vix.history(period="30d")

            # Calculate daily changes
            historical_data["Change"] = historical_data["Close"].pct_change() * 100

            # Format the response
            current_price = clean_float(current_data["Close"].iloc[-1])
            previous_close = clean_float(current_data["Open"].iloc[0])
            daily_change = clean_float(
                ((current_price - previous_close) / previous_close) * 100
                if previous_close != 0
                else 0
            )

            # Get historical data points for chart
            chart_data = historical_data[["Close", "Change"]].reset_index()
            chart_data["Date"] = chart_data["Date"].dt.strftime("%Y-%m-%d")

            # Clean historical data
            chart_data["Close"] = chart_data["Close"].apply(clean_float)
            chart_data["Change"] = chart_data["Change"].apply(clean_float)

            return {
                "current": {
                    "price": current_price,
                    "change": daily_change,
                    "high": clean_float(current_data["High"].iloc[-1]),
                    "low": clean_float(current_data["Low"].iloc[-1]),
                    "volume": int(clean_float(current_data["Volume"].iloc[-1])),
                },
                "historical": chart_data.to_dict("records"),
            }

        except Exception as e:
            logger.error(f"Error fetching VIX data: {str(e)}")
            raise


# Create a single instance of the service
vix_service = VIXService()
