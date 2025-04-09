from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import market_data, ai_chat, dashboard, hyperliquid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
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
app.include_router(market_data.router, prefix="/api/market-data", tags=["market-data"])
app.include_router(ai_chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(hyperliquid.router, prefix="/api/hyperliquid", tags=["hyperliquid"])


@app.get("/")
async def root():
    return {"message": "Welcome to Dynamic Trading Dashboard API"}
