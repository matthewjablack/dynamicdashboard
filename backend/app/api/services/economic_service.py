import aiohttp
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EconomicService:
    def __init__(self):
        self.api_key = settings.FINNHUB_API_KEY
        self.base_url = "https://finnhub.io/api/v1"

        # Add debug logging
        logger.info(f"FINNHUB_API_KEY value length: {len(self.api_key)}")
        logger.info(f"Settings loaded from config: {settings.dict()}")

        if not self.api_key:
            logger.warning(
                "FINNHUB_API_KEY not set. Economic data will not be available."
            )

    async def get_economic_calendar(
        self, from_date: str = None, to_date: str = None
    ) -> List[Dict[str, Any]]:
        """Fetch economic calendar data from Finnhub"""
        if not self.api_key:
            raise ValueError("FINNHUB_API_KEY not set. Economic data is not available.")

        try:
            # If dates not provided, default to next 30 days
            if not from_date:
                from_date = datetime.now().strftime("%Y-%m-%d")
            if not to_date:
                to_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

            url = f"{self.base_url}/calendar/economic"
            params = {"token": self.api_key, "from": from_date, "to": to_date}

            # Log request details (without the full API key)
            masked_key = f"{self.api_key[:4]}...{self.api_key[-4:]}"
            logger.info(f"Making request to {url}")
            logger.info(
                f"With params: from={from_date}, to={to_date}, token={masked_key}"
            )

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    response_text = await response.text()
                    if response.status == 200:
                        data = await response.json()
                        # Filter and format the events
                        events = []
                        for event in data.get("economicCalendar", []):
                            events.append(
                                {
                                    "event": event.get("event"),
                                    "date": event.get("date"),
                                    "country": event.get("country"),
                                    "actual": event.get("actual"),
                                    "previous": event.get("previous"),
                                    "estimate": event.get("estimate"),
                                    "impact": event.get("impact"),
                                    "unit": event.get("unit"),
                                }
                            )
                        return events
                    elif response.status == 403:
                        error_msg = (
                            "Access denied. The economic calendar endpoint requires a paid "
                            "Finnhub subscription (Starter tier or above). Please upgrade your "
                            "plan at https://finnhub.io/pricing to access this feature."
                        )
                        logger.error(f"{error_msg} Response: {response_text}")
                        raise ValueError(error_msg)
                    else:
                        error_msg = (
                            f"Error fetching economic calendar: {response.status}. "
                            f"Response: {response_text}"
                        )
                        logger.error(error_msg)
                        raise ValueError(error_msg)

        except aiohttp.ClientError as e:
            error_msg = f"Network error while fetching economic calendar: {str(e)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            logger.error(f"Error in get_economic_calendar: {str(e)}")
            raise

    async def get_fomc_meetings(self) -> List[Dict[str, Any]]:
        """Filter and return only FOMC meetings from economic calendar"""
        if not self.api_key:
            raise ValueError("FINNHUB_API_KEY not set. Economic data is not available.")

        try:
            # Get calendar for next 180 days to ensure we catch upcoming FOMC meetings
            calendar = await self.get_economic_calendar(
                from_date=datetime.now().strftime("%Y-%m-%d"),
                to_date=(datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
            )

            # Filter for FOMC-related events
            fomc_events = [
                event
                for event in calendar
                if "FOMC" in event.get("event", "").upper()
                or "Federal Reserve" in event.get("event", "")
            ]

            return fomc_events

        except Exception as e:
            logger.error(f"Error in get_fomc_meetings: {str(e)}")
            raise
