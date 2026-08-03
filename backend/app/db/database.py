import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

class ResearchRecord(Base):
    __tablename__ = "research_history"

    id = Column(String(36), primary_key=True, index=True)
    topic = Column(String(255), nullable=False, index=True)
    sources = Column(Text, nullable=False)  # JSON list
    days = Column(Integer, default=30)
    status = Column(String(50), default="pending")
    progress = Column(Integer, default=0)
    step_message = Column(String(255), default="Initialized")
    key_insights = Column(Text, nullable=True)
    feeds = Column(Text, nullable=True)  # JSON list of feed cards
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session

async def find_cached_research(session: AsyncSession, topic: str, days: int, sources: List[str]) -> Optional[ResearchRecord]:
    """Finds non-expired valid research result for identical topic and sources within TTL hours."""
    cutoff = datetime.utcnow() - timedelta(hours=settings.CACHE_TTL_HOURS)
    normalized_topic = topic.strip().lower()
    sources_str = json.dumps(sorted(sources))

    result = await session.execute(
        Base.metadata.tables["research_history"].select()
        .where(ResearchRecord.topic == normalized_topic)
        .where(ResearchRecord.days == days)
        .where(ResearchRecord.sources == sources_str)
        .where(ResearchRecord.status == "completed")
        .where(ResearchRecord.created_at >= cutoff)
        .order_by(ResearchRecord.created_at.desc())
        .limit(1)
    )
    row = result.first()
    if row:
        return await session.get(ResearchRecord, row.id)
    return None
