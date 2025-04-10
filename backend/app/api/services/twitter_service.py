import os
from typing import List, Optional
import requests
from datetime import datetime, timedelta
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class TwitterService:
    def __init__(self):
        self.api_key = settings.TWITTER_API_KEY
        self.base_url = "https://api.twitterapi.io/twitter/tweet/advanced_search"
        logger.info(f"Initialized TwitterService with base URL: {self.base_url}")
        logger.debug(f"API Key loaded: {'Yes' if self.api_key else 'No'}")

    def parse_twitter_date(self, date_str: str) -> datetime:
        """Parse Twitter's date format to datetime object"""
        try:
            # Twitter date format: "Thu Apr 10 16:49:33 +0000 2025"
            return datetime.strptime(date_str, "%a %b %d %H:%M:%S %z %Y")
        except Exception as e:
            logger.warning(f"Error parsing date {date_str}: {e}")
            return datetime.min

    def get_user_tweets(
        self, usernames: List[str], limit: int = 10, hours: Optional[int] = None
    ) -> List[dict]:
        """
        Get tweets from multiple users with optional time filtering
        """
        try:
            logger.info(
                f"Fetching tweets for usernames: {usernames}, limit: {limit}, hours: {hours}"
            )
            headers = {"X-API-Key": self.api_key}
            logger.debug(f"Request headers: {headers}")
            all_tweets = []

            for username in usernames:
                # Build query parameters - match curl command format exactly
                query = f"from:{username}"

                # Add time filter if specified
                if hours:
                    start_time = datetime.utcnow() - timedelta(hours=hours)
                    query += f" since:{start_time.strftime('%Y-%m-%d_%H:%M:%S_UTC')}"

                params = {"query": query}

                logger.info(f"Making request to Twitter API for username: {username}")
                logger.debug(f"Request URL: {self.base_url}")
                logger.debug(f"Request params: {params}")
                logger.debug(f"Request headers: {headers}")

                # Make API request
                response = requests.get(
                    self.base_url,
                    headers=headers,
                    params=params,
                    timeout=30,
                )

                logger.info(f"Twitter API response status: {response.status_code}")
                logger.debug(f"Response headers: {response.headers}")
                logger.debug(f"Full API response: {response.text}")

                if response.status_code != 200:
                    logger.error(f"Twitter API error: {response.text}")
                    response.raise_for_status()

                # Add tweets to collection
                response_data = response.json()
                logger.debug(f"Response data structure: {response_data}")

                # Check if tweets exist in response
                if "tweets" not in response_data:
                    logger.warning(
                        f"No 'tweets' field in response for username: {username}"
                    )
                    continue

                tweets = response_data["tweets"]
                logger.info(f"Retrieved {len(tweets)} tweets for username: {username}")

                # Transform tweets to match expected format
                transformed_tweets = []
                for tweet in tweets:
                    transformed_tweet = {
                        "id": tweet["id"],
                        "text": tweet["text"],
                        "created_at": tweet["createdAt"],
                        "author": {
                            "username": tweet["author"]["userName"],
                            "name": tweet["author"]["name"],
                            "profile_image_url": tweet["author"]["profilePicture"],
                        },
                        "public_metrics": {
                            "retweet_count": tweet["retweetCount"],
                            "reply_count": tweet["replyCount"],
                            "like_count": tweet["likeCount"],
                            "quote_count": tweet["quoteCount"],
                        },
                    }
                    transformed_tweets.append(transformed_tweet)

                all_tweets.extend(transformed_tweets)

            # Sort all tweets by date
            all_tweets.sort(
                key=lambda x: self.parse_twitter_date(x["created_at"]),
                reverse=True,  # Most recent first
            )

            # Limit after sorting all tweets
            limited_tweets = all_tweets[:limit]
            logger.info(
                f"Returning {len(limited_tweets)} tweets after sorting and limiting"
            )
            return limited_tweets

        except Exception as e:
            logger.error(f"Error in get_user_tweets: {str(e)}", exc_info=True)
            raise
