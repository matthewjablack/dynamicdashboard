import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest_asyncio.fixture
async def async_test_client():
    from httpx import AsyncClient

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
