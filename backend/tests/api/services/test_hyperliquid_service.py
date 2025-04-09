import pytest
import pytest_asyncio
from datetime import datetime
from httpx import AsyncClient
from unittest.mock import patch, Mock
from app.api.services.hyperliquid_service import HyperliquidService


@pytest.fixture
def mock_candles_response():
    return [
        # [timestamp, open, high, low, close, volume]
        [1708646400000, "50000.5", "51000.0", "49500.0", "50750.2", "1000.5"],
        [1708650000000, "50750.2", "52000.0", "50500.0", "51500.3", "1200.7"],
    ]


@pytest.fixture
def mock_market_data_response():
    return [
        {"universe": []},
        [
            {
                "name": "BTC",
                "dayNtlVlm": "1169046.29406",
                "funding": "0.0000125",
                "markPx": "50050.6",
                "impactPxs": ["50000.5", "50100.7"],
            }
        ],
    ]


@pytest.fixture
def mock_funding_rates_response():
    return [
        {
            "coin": "BTC",
            "fundingRate": "-0.00022196",
            "premium": "-0.00052196",
            "time": 1683849600076,
        }
    ]


@pytest_asyncio.fixture
async def hyperliquid_service():
    return HyperliquidService()


@pytest.mark.asyncio
async def test_get_candles(hyperliquid_service):
    mock_candle_data = [
        [1683849600000, "50000.5", "50100.7", "49900.3", "50050.6", "100.5"]
    ]
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: mock_candle_data,
            raise_for_status=lambda: None,
        )

        result = await hyperliquid_service.get_candles("BTC")
        assert len(result) == 1
        assert result[0]["time"] == 1683849600000
        assert result[0]["open"] == 50000.5
        assert result[0]["high"] == 50100.7
        assert result[0]["low"] == 49900.3
        assert result[0]["close"] == 50050.6
        assert result[0]["volume"] == 100.5


@pytest.mark.asyncio
async def test_get_market_data(hyperliquid_service, mock_market_data_response):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: mock_market_data_response,
            raise_for_status=lambda: None,
        )

        result = await hyperliquid_service.get_market_data("BTC")
        assert result["dayNtlVlm"] == "1169046.29406"
        assert result["funding"] == "0.0000125"
        assert result["markPx"] == "50050.6"
        assert result["impactPxs"] == ["50000.5", "50100.7"]


@pytest.mark.asyncio
async def test_get_funding_rates(hyperliquid_service, mock_funding_rates_response):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: mock_funding_rates_response,
            raise_for_status=lambda: None,
        )

        result = await hyperliquid_service.get_funding_rates("BTC")
        assert len(result) == 1
        assert result[0]["coin"] == "BTC"
        assert result[0]["fundingRate"] == "-0.00022196"
        assert result[0]["time"] == 1683849600076


@pytest.mark.asyncio
async def test_error_handling(hyperliquid_service):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.side_effect = Exception("API Error")
        with pytest.raises(Exception):
            await hyperliquid_service.get_candles("BTC")
