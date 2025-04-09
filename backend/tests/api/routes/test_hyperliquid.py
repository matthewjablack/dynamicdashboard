from fastapi.testclient import TestClient
import pytest
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)


@pytest.fixture
def mock_candles_data():
    return [
        {
            "time": 1708646400000,
            "open": "50000.5",
            "high": "51000.0",
            "low": "49500.0",
            "close": "50750.2",
            "volume": "1000.5",
        },
        {
            "time": 1708650000000,
            "open": "50750.2",
            "high": "52000.0",
            "low": "50500.0",
            "close": "51500.3",
            "volume": "1200.7",
        },
    ]


@pytest.fixture
def mock_market_data():
    return {
        "dayNtlVlm": "1169046.29406",
        "funding": "0.0000125",
        "impactPxs": ["50000.5", "50100.7"],
        "markPx": "50050.6",
        "midPx": "50050.0",
        "openInterest": "688.11",
        "oraclePx": "50055.5",
        "premium": "0.00031774",
        "prevDayPx": "49500.5",
    }


@pytest.mark.asyncio
async def test_get_candles(mock_candles_data):
    with patch(
        "app.api.services.hyperliquid_service.HyperliquidService.get_candles",
        new_callable=AsyncMock,
    ) as mock_get_candles:
        mock_get_candles.return_value = mock_candles_data

        response = client.get("/api/hyperliquid/candles/BTC?interval=1m&limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["open"] == "50000.5"
        assert data[0]["high"] == "51000.0"
        assert data[0]["low"] == "49500.0"
        assert data[0]["close"] == "50750.2"
        assert data[0]["volume"] == "1000.5"

        mock_get_candles.assert_called_once_with("BTC", "1m", 2)


@pytest.mark.asyncio
async def test_get_market_data(mock_market_data):
    with patch(
        "app.api.services.hyperliquid_service.HyperliquidService.get_market_data",
        new_callable=AsyncMock,
    ) as mock_get_market_data:
        mock_get_market_data.return_value = mock_market_data

        response = client.get("/api/hyperliquid/market-data/BTC")

        assert response.status_code == 200
        data = response.json()
        assert data["dayNtlVlm"] == "1169046.29406"
        assert data["funding"] == "0.0000125"
        assert data["markPx"] == "50050.6"
        assert data["openInterest"] == "688.11"

        mock_get_market_data.assert_called_once_with("BTC")


@pytest.mark.asyncio
async def test_get_candles_invalid_params():
    response = client.get("/api/hyperliquid/candles/BTC?interval=invalid&limit=abc")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_candles_service_error():
    with patch(
        "app.api.services.hyperliquid_service.HyperliquidService.get_candles",
        new_callable=AsyncMock,
    ) as mock_get_candles:
        mock_get_candles.side_effect = Exception("API Error")

        response = client.get("/api/hyperliquid/candles/BTC?interval=1m&limit=100")

        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error"


@pytest.mark.asyncio
async def test_get_market_data_service_error():
    with patch(
        "app.api.services.hyperliquid_service.HyperliquidService.get_market_data",
        new_callable=AsyncMock,
    ) as mock_get_market_data:
        mock_get_market_data.side_effect = Exception("API Error")

        response = client.get("/api/hyperliquid/market-data/BTC")

        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error"
