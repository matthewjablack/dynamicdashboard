from fastapi import APIRouter, HTTPException
from typing import List, Optional
from ..services.twitter_service import TwitterService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
twitter_service = TwitterService()


@router.get("/tweets")
async def get_user_tweets(usernames: str, limit: int = 10, hours: Optional[int] = None):
    try:
        logger.info(
            f"Received request for tweets - usernames: {usernames}, limit: {limit}, hours: {hours}"
        )

        # Split usernames by comma and trim whitespace
        username_list = [u.strip() for u in usernames.split(",")]
        logger.info(f"Processed username list: {username_list}")

        # Get tweets from service
        logger.info("Calling TwitterService.get_user_tweets")
        tweets = twitter_service.get_user_tweets(username_list, limit, hours)
        logger.info(f"Successfully retrieved {len(tweets)} tweets")

        return {"data": tweets}
    except Exception as e:
        logger.error(f"Error in get_user_tweets endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch tweets: {str(e)}")
