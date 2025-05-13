# Routes package initialization

from . import market_data
from . import ai_chat
from . import dashboard
from . import hyperliquid
from . import twitter
from . import ccxt
from . import deribit
from . import economic
from . import vix
from . import auth
from fastapi import APIRouter
from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .ccxt import router as ccxt_router
from .deribit import router as deribit_router
from .economic import router as economic_router
from .fred import router as fred_router
from .hyperliquid import router as hyperliquid_router
from .market_data import router as market_data_router
from .twitter import router as twitter_router
from .vix import router as vix_router
from .truthsocial import router as truthsocial_router
from .ai_chat import router as ai_chat_router
from .domains import router as domains_router

# Export routers
market_data = market_data
ai_chat = ai_chat
dashboard = dashboard
hyperliquid = hyperliquid
twitter = twitter
ccxt = ccxt
deribit = deribit
economic = economic
vix = vix
auth = auth

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(ccxt_router, prefix="/ccxt", tags=["ccxt"])
router.include_router(deribit_router, prefix="/deribit", tags=["deribit"])
router.include_router(economic_router, prefix="/economic", tags=["economic"])
router.include_router(fred_router, prefix="/fred", tags=["fred"])
router.include_router(hyperliquid_router, prefix="/hyperliquid", tags=["hyperliquid"])
router.include_router(market_data_router, prefix="/market-data", tags=["market-data"])
router.include_router(twitter_router, prefix="/twitter", tags=["twitter"])
router.include_router(vix_router, prefix="/vix", tags=["vix"])
router.include_router(truthsocial_router, prefix="/truthsocial", tags=["truthsocial"])
router.include_router(ai_chat_router, prefix="/ai-chat", tags=["ai-chat"])
router.include_router(domains_router, prefix="/domains", tags=["domains"])
