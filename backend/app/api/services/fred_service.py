import os
from typing import List, Optional, Dict
import requests
from datetime import datetime, timedelta
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class FREDService:
    def __init__(self):
        self.api_key = settings.FRED_API_KEY
        self.base_url = "https://api.stlouisfed.org/fred"
        logger.info(f"Initialized FREDService with base URL: {self.base_url}")
        logger.debug(f"API Key loaded: {'Yes' if self.api_key else 'No'}")

    def get_series(self, series_id: str, limit: int = 10) -> List[dict]:
        """
        Get economic data series from FRED
        Args:
            series_id: FRED series ID (e.g., 'GDPC1', 'UNRATE', etc.)
            limit: Maximum number of observations to return
        """
        try:
            logger.info(f"Fetching FRED series: {series_id}, limit: {limit}")

            # First get series metadata
            metadata_params = {
                "api_key": self.api_key,
                "file_type": "json",
                "series_id": series_id,
            }

            metadata_response = requests.get(
                f"{self.base_url}/series", params=metadata_params, timeout=30
            )

            if metadata_response.status_code != 200:
                error_data = metadata_response.json()
                logger.error(f"FRED API error getting series metadata: {error_data}")
                metadata_response.raise_for_status()

            metadata = metadata_response.json()
            if "seriess" not in metadata or not metadata["seriess"]:
                raise ValueError(
                    f"Series ID '{series_id}' not found. Please check the series ID and try again."
                )

            # Now get the observations
            params = {
                "api_key": self.api_key,
                "file_type": "json",
                "series_id": series_id,
                "limit": limit,
                "sort_order": "desc",  # Most recent first
                "units": "lin",  # Linear units
            }

            response = requests.get(
                f"{self.base_url}/series/observations", params=params, timeout=30
            )

            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"FRED API error getting observations: {error_data}")
                response.raise_for_status()

            data = response.json()

            if "observations" not in data:
                logger.warning(f"No observations found for series: {series_id}")
                return []

            # Transform the data into a more usable format
            observations = []
            for obs in data["observations"]:
                try:
                    value = float(obs["value"]) if obs["value"] != "." else None
                    observations.append(
                        {
                            "date": obs["date"],
                            "value": value,
                            "series_id": series_id,
                            "title": metadata["seriess"][0]["title"],
                            "units": metadata["seriess"][0]["units"],
                            "frequency": metadata["seriess"][0]["frequency"],
                        }
                    )
                except (ValueError, TypeError) as e:
                    logger.warning(
                        f"Error processing observation for date {obs.get('date')}: {str(e)}"
                    )
                    continue

            return observations

        except ValueError as ve:
            logger.error(f"Validation error in get_series: {str(ve)}")
            raise
        except Exception as e:
            logger.error(f"Error in get_series: {str(e)}", exc_info=True)
            raise

    def search_series(self, search_text: str, limit: int = 10) -> List[dict]:
        """
        Search for FRED series by text
        Args:
            search_text: Text to search for in series titles
            limit: Maximum number of results to return
        """
        try:
            logger.info(f"Searching FRED series for: {search_text}")

            params = {
                "api_key": self.api_key,
                "file_type": "json",
                "search_text": search_text,
                "limit": limit,
                "sort_order": "desc",
                "order_by": "popularity",
                "filter_variable": "frequency",
                "filter_value": "Monthly,Quarterly,Annual",  # Common frequencies
            }

            response = requests.get(
                f"{self.base_url}/series/search", params=params, timeout=30
            )

            if response.status_code != 200:
                error_data = response.json()
                logger.error(f"FRED API error in search: {error_data}")
                response.raise_for_status()

            data = response.json()

            if "seriess" not in data:
                logger.warning(f"No series found for search: {search_text}")
                return []

            # Transform the search results to include more useful information
            results = []
            for series in data["seriess"]:
                results.append(
                    {
                        "id": series["id"],
                        "title": series["title"],
                        "frequency": series["frequency"],
                        "units": series["units"],
                        "seasonal_adjustment": series["seasonal_adjustment"],
                        "last_updated": series["last_updated"],
                        "notes": series.get("notes", ""),
                        "observation_start": series["observation_start"],
                        "observation_end": series["observation_end"],
                    }
                )

            return results

        except Exception as e:
            logger.error(f"Error in search_series: {str(e)}", exc_info=True)
            raise

    def get_upcoming_releases(
        self, filter_names: Optional[List[str]] = None
    ) -> List[dict]:
        """
        Fetch all upcoming economic releases from FRED, optionally filtering by release names.
        Args:
            filter_names: Optional list of release names to include (case-insensitive, partial match allowed)
        Returns:
            List of upcoming releases with name, id, link, and notes
        """
        try:
            logger.info(f"Fetching all FRED releases. Filter: {filter_names}")
            params = {
                "api_key": self.api_key,
                "file_type": "json",
                "sort_order": "asc",
                "order_by": "release_id",
                "limit": 1000,
            }
            response = requests.get(
                f"{self.base_url}/releases", params=params, timeout=30
            )
            if response.status_code != 200:
                logger.error(f"FRED API error getting releases: {response.text}")
                response.raise_for_status()
            data = response.json()
            if "releases" not in data:
                logger.warning("No releases found in FRED response.")
                return []
            releases = data["releases"]
            # Optionally filter by name
            if filter_names:
                filter_names_lower = [n.lower() for n in filter_names]
                releases = [
                    r
                    for r in releases
                    if any(fn in r["name"].lower() for fn in filter_names_lower)
                ]
            # Only include future releases if possible (FRED does not provide future dates here, but we can include all for now)
            # For each release, include id, name, link, notes
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "link": r.get("link", None),
                    "notes": r.get("notes", ""),
                }
                for r in releases
            ]
        except Exception as e:
            logger.error(f"Error in get_upcoming_releases: {str(e)}", exc_info=True)
            raise
