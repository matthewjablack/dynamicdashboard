from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    market_data,
    ai_chat,
    dashboard,
    hyperliquid,
    twitter,
    ccxt,
    deribit,
    economic,
    vix,
    auth,
    truthsocial,
    fred,
)
from app.db.session import engine
from app.models import user as user_model
from app.models import (
    dashboard as dashboard_model,
)  # Rename the import to avoid conflict
import logging
import sys

# Create database tables
user_model.Base.metadata.create_all(bind=engine)
dashboard_model.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log", mode="a", encoding="utf-8"),
    ],
)

# Set log levels for specific modules
logging.getLogger("app.api").setLevel(logging.INFO)
logging.getLogger("app.api.services").setLevel(logging.INFO)
logging.getLogger("app.api.routes").setLevel(logging.INFO)
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("fastapi").setLevel(logging.INFO)
logging.getLogger("ccxt").setLevel(logging.INFO)  # Prevent CCXT debug logs
logging.getLogger("urllib3").setLevel(logging.INFO)  # Prevent urllib3 debug logs

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Dynamic Trading Dashboard API",
    description="API for AI-powered trading dashboard",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(market_data.router, prefix="/api/market-data", tags=["market-data"])
app.include_router(ai_chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(hyperliquid.router, prefix="/api/hyperliquid", tags=["hyperliquid"])
app.include_router(twitter.router, prefix="/api/twitter", tags=["twitter"])
app.include_router(ccxt.router, prefix="/api/ccxt", tags=["ccxt"])
app.include_router(deribit.router, prefix="/api/deribit", tags=["deribit"])
app.include_router(economic.router, prefix="/api/economic", tags=["economic"])
app.include_router(vix.router, prefix="/api/vix", tags=["vix"])
app.include_router(truthsocial.router, prefix="/api/truthsocial", tags=["truthsocial"])
app.include_router(fred.router, prefix="/api/fred", tags=["fred"])


@app.get("/")
async def root():
    return {"message": "Welcome to Dynamic Trading Dashboard API"}
