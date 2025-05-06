from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..services.fred_service import FREDService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
fred_service = FREDService()


@router.get("/series/{series_id}")
async def get_series(series_id: str, limit: int = 10):
    try:
        logger.info(
            f"Received request for FRED series - series_id: {series_id}, limit: {limit}"
        )

        observations = fred_service.get_series(series_id, limit)
        logger.info(f"Successfully retrieved {len(observations)} observations")

        return {"data": observations}
    except Exception as e:
        logger.error(f"Error in get_series endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch FRED data: {str(e)}"
        )


@router.get("/search")
async def search_series(search_text: str, limit: int = 10):
    try:
        logger.info(
            f"Received search request - search_text: {search_text}, limit: {limit}"
        )

        results = fred_service.search_series(search_text, limit)
        logger.info(f"Successfully retrieved {len(results)} search results")

        return {"data": results}
    except Exception as e:
        logger.error(f"Error in search_series endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to search FRED series: {str(e)}"
        )


@router.get("/releases/upcoming")
async def get_upcoming_releases(filter_names: Optional[List[str]] = None):
    try:
        logger.info(
            f"Received request for upcoming FRED releases. Filter: {filter_names}"
        )
        releases = fred_service.get_upcoming_releases(filter_names)
        logger.info(f"Successfully retrieved {len(releases)} releases")
        return {"data": releases}
    except Exception as e:
        logger.error(
            f"Error in get_upcoming_releases endpoint: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch FRED releases: {str(e)}"
        )
