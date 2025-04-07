from typing import List, Dict, Any
import openai
from app.core.config import settings


class AIService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.system_prompt = """You are an AI assistant for a trading dashboard. Your role is to:
        1. Understand user requests for dashboard components
        2. Generate appropriate component configurations
        3. Suggest relevant data sources and visualizations
        4. Help users customize their trading views
        
        Available component types:
        - Price tickers
        - Candlestick charts
        - Volume charts
        - Portfolio performance
        - News feeds
        - Custom metrics
        
        Always respond with structured data that can be used to create dashboard components."""

    async def process_chat_message(self, message: str) -> Dict[str, Any]:
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": message},
                ],
                temperature=0.7,
            )

            # Parse the response and generate component configurations
            components = self._parse_ai_response(response.choices[0].message.content)

            return {
                "message": response.choices[0].message.content,
                "components": components,
            }
        except Exception as e:
            raise Exception(f"Error processing chat message: {str(e)}")

    def _parse_ai_response(self, response: str) -> List[Dict[str, Any]]:
        # This is a simplified version - in reality, you'd want more sophisticated parsing
        # and validation of the AI's response
        components = []

        # Example parsing logic (to be enhanced based on your needs)
        if "price" in response.lower() or "ticker" in response.lower():
            components.append(
                {
                    "type": "price_ticker",
                    "config": {
                        "symbols": self._extract_symbols(response),
                        "currency": "CAD",
                    },
                }
            )

        if "chart" in response.lower():
            components.append(
                {
                    "type": "candlestick_chart",
                    "config": {
                        "symbols": self._extract_symbols(response),
                        "timeframe": "1d",
                        "currency": "CAD",
                    },
                }
            )

        return components

    def _extract_symbols(self, text: str) -> List[str]:
        # Simple symbol extraction - enhance based on your needs
        symbols = []
        common_symbols = ["BTC", "ETH", "LTC", "MSTR"]

        for symbol in common_symbols:
            if symbol in text.upper():
                symbols.append(symbol)

        return symbols
