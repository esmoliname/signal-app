"""API behavior tests using FastAPI TestClient with a temp-file SQLite DB."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.db.database as database
from app.db.database import ResearchRecord  # noqa: F401  (ensure tables are registered)


@pytest.fixture
def client(tmp_path, monkeypatch):
    """TestClient backed by a temp-file SQLite database (not the real signal_cache.db)."""
    db_path = tmp_path / "test_api.db"
    url = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    engine = create_async_engine(url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    monkeypatch.setattr(database, "engine", engine)
    monkeypatch.setattr(database, "AsyncSessionLocal", session_factory)

    # Import here so the app resolves the (already-patched) database globals at call time.
    from app.main import app

    with TestClient(app) as c:
        yield c


def test_health_ok(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert "skill" in body
    assert isinstance(body["skill"].get("exists"), bool)
    assert isinstance(body["skill"].get("script_exists"), bool)
    # must NOT leak the absolute python executable or absolute skill path
    assert "python" not in body
    assert body["skill"].get("path") is None


def test_research_rejects_empty_topic(client):
    resp = client.post("/api/research", json={"topic": "", "days": 30})
    assert resp.status_code == 422


def test_research_rejects_days_out_of_range(client):
    resp = client.post("/api/research",
                       json={"topic": "webgpu", "days": 0, "sources": ["hn"]})
    assert resp.status_code == 422


def test_research_creates_record(client):
    resp = client.post("/api/research",
                       json={"topic": "ai agents", "days": 30, "sources": ["reddit", "hn"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["topic"] == "ai agents"
    assert body["status"] == "pending"
    assert body["is_cached"] is False
    assert body["task_id"]


def test_history_q_filter_limits_in_sql(client):
    """q search should be filtered in SQL (so limit applies after the match),
    and the response shape should match the /history contract."""
    import asyncio
    from app.db.database import ResearchRecord
    from datetime import datetime

    async def seed():
        async with database.AsyncSessionLocal() as s:
            s.add(ResearchRecord(
                id="a", topic="webgpu compute", sources='["hn"]', days=30,
                status="completed", progress=100, created_at=datetime.utcnow(),
            ))
            s.add(ResearchRecord(
                id="b", topic="rust async", sources='["github"]', days=30,
                status="completed", progress=100, created_at=datetime.utcnow(),
            ))
            await s.commit()

    asyncio.run(seed())

    resp = client.get("/api/history", params={"q": "webgpu", "limit": 5})
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert [i["id"] for i in items] == ["a"]

    # full list returns both
    resp_all = client.get("/api/history", params={"limit": 5})
    ids = {i["topic"] for i in resp_all.json()}
    assert {"webgpu compute", "rust async"} == ids
