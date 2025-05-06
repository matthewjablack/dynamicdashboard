from fastapi import APIRouter
from .routes import twitter, ccxt, dashboard, fred

api_router = APIRouter()

api_router.include_router(twitter.router, prefix="/twitter", tags=["twitter"])
api_router.include_router(ccxt.router, prefix="/ccxt", tags=["ccxt"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(fred.router, prefix="/fred", tags=["fred"])
