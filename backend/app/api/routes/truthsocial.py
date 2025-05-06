import os
import requests
from fastapi import APIRouter, HTTPException, Query
from typing import List

router = APIRouter()

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
APIFY_ACTOR_ID = "louisdeconinck~truth-social-scraper"


@router.get("/posts")
async def get_truthsocial_posts(
    identifiers: List[str] = Query(
        ..., description="List of Truth Social usernames or profile URLs"
    ),
):
    if not APIFY_API_TOKEN:
        raise HTTPException(
            status_code=500, detail="APIFY_API_TOKEN not set in environment"
        )

    url = f"https://api.apify.com/v2/acts/{APIFY_ACTOR_ID}/run-sync-get-dataset-items?token={APIFY_API_TOKEN}"
    payload = {"identifiers": identifiers}
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch Truth Social posts: {str(e)}"
        )
