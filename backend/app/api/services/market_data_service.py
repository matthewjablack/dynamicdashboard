import ccxt
import asyncio
from typing import List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np


class MarketDataService:
    def __init__(self):
        self.exchange = ccxt.binance(
            {
                "enableRateLimit": True,
            }
        )

    async def get_current_prices(
        self, symbols: List[str], currency: str = "CAD"
    ) -> Dict[str, float]:
        """Fetch current prices for given symbols"""
        prices = {}
        for symbol in symbols:
            try:
                ticker = await self.exchange.fetch_ticker(f"{symbol}/USDT")
                # Convert to CAD if needed
                if currency == "CAD":
                    usd_cad = await self.exchange.fetch_ticker("USDT/CAD")
                    price = ticker["last"] * usd_cad["last"]
                else:
                    price = ticker["last"]
                prices[symbol] = price
            except Exception as e:
                print(f"Error fetching price for {symbol}: {str(e)}")
                prices[symbol] = None
        return prices

    async def get_historical_data(
        self,
        symbol: str,
        timeframe: str = "1d",
        limit: int = 100,
        currency: str = "CAD",
    ) -> List[Dict[str, Any]]:
        """Fetch historical OHLCV data"""
        try:
            ohlcv = await self.exchange.fetch_ohlcv(
                f"{symbol}/USDT", timeframe, limit=limit
            )

            # Convert to CAD if needed
            if currency == "CAD":
                usd_cad = await self.exchange.fetch_ticker("USDT/CAD")
                cad_rate = usd_cad["last"]
            else:
                cad_rate = 1.0

            data = []
            for candle in ohlcv:
                timestamp, open_price, high, low, close, volume = candle
                # Format time for Lightweight Charts
                time = datetime.fromtimestamp(timestamp / 1000).strftime("%Y-%m-%d")
                data.append(
                    {
                        "time": time,
                        "open": open_price * cad_rate,
                        "high": high * cad_rate,
                        "low": low * cad_rate,
                        "close": close * cad_rate,
                        "volume": volume,
                    }
                )
            return data
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {str(e)}")
            return []

    async def get_technical_indicators(
        self, symbol: str, timeframe: str = "1d", limit: int = 100
    ) -> Dict[str, List[float]]:
        """Calculate technical indicators"""
        try:
            ohlcv = await self.exchange.fetch_ohlcv(
                f"{symbol}/USDT", timeframe, limit=limit
            )
            df = pd.DataFrame(
                ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
            )

            # Calculate simple moving averages
            df["sma_20"] = df["close"].rolling(window=20).mean()
            df["sma_50"] = df["close"].rolling(window=50).mean()

            # Calculate RSI
            delta = df["close"].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df["rsi"] = 100 - (100 / (1 + rs))

            return {
                "sma_20": df["sma_20"].tolist(),
                "sma_50": df["sma_50"].tolist(),
                "rsi": df["rsi"].tolist(),
            }
        except Exception as e:
            print(f"Error calculating indicators for {symbol}: {str(e)}")
            return {}
