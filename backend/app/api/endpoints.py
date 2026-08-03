import os
import uuid
import json
import asyncio
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sse_starlette.sse import EventSourceResponse

from app.core.config import settings
from app.db.database import get_db_session, ResearchRecord, find_cached_research
from app.core.skill_runner import execute_last30days_skill

logger = logging.getLogger("signal.endpoints")
router = APIRouter(prefix="/api", tags=["signal"])


# ─── Schemas ──────────────────────────────────────────────────────────────── #

class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    sources: List[str] = Field(default=["reddit", "youtube", "hn", "github"])
    days: int = Field(default=30, ge=1, le=90)
    force_refresh: bool = False


class ResearchResponse(BaseModel):
    task_id: str
    topic: str
    sources: List[str]
    days: int
    status: str
    is_cached: bool


class RenameRequest(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


# ─── Research ────────────────────────────────────────────────────────────── #

@router.post("/research", response_model=ResearchResponse)
async def create_research(
    payload: ResearchRequest,
    db: AsyncSession = Depends(get_db_session),
):
    topic   = payload.topic.strip()
    sources = payload.sources or ["reddit", "youtube", "hn", "github"]
    days    = payload.days

    # Cache check
    if not payload.force_refresh:
        cached = await find_cached_research(db, topic, days, sources)
        if cached:
            return ResearchResponse(
                task_id=cached.id, topic=cached.topic,
                sources=json.loads(cached.sources), days=cached.days,
                status=cached.status, is_cached=True,
            )

    task_id = str(uuid.uuid4())
    record = ResearchRecord(
        id=task_id, topic=topic,
        sources=json.dumps(sources), days=days,
        status="pending", progress=0,
        step_message="En cola",
    )
    db.add(record)
    await db.commit()

    return ResearchResponse(
        task_id=task_id, topic=topic, sources=sources,
        days=days, status="pending", is_cached=False,
    )


@router.get("/research/{task_id}/stream")
async def stream_research(
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    record = await db.get(ResearchRecord, task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Already completed → send a single progress+complete burst
    if record.status == "completed":
        async def _cached_gen():
            yield {"event": "progress",
                   "data": json.dumps({"progress": 100, "step": "Recuperado de caché"})}
            yield {"event": "complete",
                   "data": json.dumps({
                       "task_id": record.id,
                       "key_insights": record.key_insights,
                       "feeds": json.loads(record.feeds) if record.feeds else [],
                   })}
        return EventSourceResponse(_cached_gen())

    # Run the skill and stream progress events
    async def _run_gen():
        topic   = record.topic
        sources = json.loads(record.sources)
        days    = record.days

        record.status = "running"
        await db.commit()

        async for ev in execute_last30days_skill(task_id, topic, sources, days):
            event_type = ev.get("event", "progress")
            progress   = ev.get("progress", 0)
            step       = ev.get("step", "")

            record.progress    = progress
            record.step_message = step
            await db.commit()

            if event_type == "complete":
                data = ev.get("data", {})
                record.status       = "completed"
                record.key_insights = data.get("key_insights", "")
                record.feeds        = json.dumps(data.get("feeds", []))
                await db.commit()

                yield {"event": "complete",
                       "data": json.dumps({
                           "task_id":      task_id,
                           "key_insights": record.key_insights,
                           "feeds":        data.get("feeds", []),
                       })}
            else:
                yield {"event": "progress",
                       "data": json.dumps({"progress": progress, "step": step})}

    return EventSourceResponse(_run_gen())


@router.get("/research/{task_id}")
async def get_research_detail(
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    record = await db.get(ResearchRecord, task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigación no encontrada")

    return {
        "id":           record.id,
        "topic":        record.topic,
        "title":        record.topic,
        "sources":      json.loads(record.sources) if record.sources else [],
        "days":         record.days,
        "status":       record.status,
        "progress":     record.progress,
        "step_message": record.step_message,
        "key_insights": record.key_insights,
        "feeds":        json.loads(record.feeds) if record.feeds else [],
        "created_at":   record.created_at.isoformat(),
        "updated_at":   record.updated_at.isoformat(),
    }


# ─── History ──────────────────────────────────────────────────────────────── #

@router.get("/history")
async def get_history(
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    query = (
        select(ResearchRecord)
        .where(ResearchRecord.status == "completed")
        .order_by(desc(ResearchRecord.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    records = result.scalars().all()

    if q:
        kw = q.strip().lower()
        records = [r for r in records if kw in (r.topic or "").lower()]

    return [
        {
            "id":         r.id,
            "topic":      r.topic,
            "title":      r.topic,
            "sources":    json.loads(r.sources) if r.sources else [],
            "days":       r.days,
            "status":     r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@router.delete("/history/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(
    task_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    record = await db.get(ResearchRecord, task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigación no encontrada")
    await db.delete(record)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/history/{task_id}")
async def rename_history(
    task_id: str,
    payload: RenameRequest,
    db: AsyncSession = Depends(get_db_session),
):
    record = await db.get(ResearchRecord, task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigación no encontrada")

    new_title = (payload.title or payload.topic or "").strip()
    if not new_title:
        raise HTTPException(status_code=400, detail="El título no puede estar vacío")

    record.topic = new_title
    await db.commit()
    return {"id": record.id, "topic": record.topic, "title": record.topic,
            "updated_at": record.updated_at.isoformat()}


# ─── Chat ────────────────────────────────────────────────────────────────── #

@router.post("/research/{task_id}/chat")
async def research_chat(
    task_id: str,
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db_session),
):
    record = await db.get(ResearchRecord, task_id)
    if not record:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    topic    = record.topic
    msg      = payload.message.strip()
    feeds    = json.loads(record.feeds) if record.feeds else []
    insights = record.key_insights or ""

    # Build a contextual reply from the stored data
    reply = f"### Seguimiento: {topic}\n\n"

    kw = msg.lower()
    if any(w in kw for w in ["resumen", "viñeta", "puntos", "clave", "summar"]):
        # Pull key bullet points from stored insights
        bullets = [ln.strip() for ln in insights.splitlines()
                   if ln.strip().startswith(("1.", "2.", "3.", "-", "•", "*", "###"))][:6]
        if bullets:
            reply += "\n".join(bullets)
        else:
            reply += (
                f"Los datos de los últimos {record.days} días sobre **{topic}** muestran "
                f"actividad en {len(feeds)} fuentes procesadas."
            )
    elif "reddit" in kw:
        reddit_items = [f for f in feeds if f.get("source") == "reddit"][:3]
        if reddit_items:
            reply += f"Discusiones de Reddit sobre **{topic}**:\n\n"
            for r in reddit_items:
                reply += f"- **[{r['title']}]({r['url']})** — {r.get('excerpt','')[:120]}\n"
        else:
            reply += f"No se registraron discusiones de Reddit en los últimos {record.days} días para **{topic}**."
    elif "github" in kw:
        gh_items = [f for f in feeds if f.get("source") == "github"][:3]
        if gh_items:
            reply += f"Repositorios de GitHub sobre **{topic}**:\n\n"
            for g in gh_items:
                reply += f"- **[{g['title']}]({g['url']})** — {g.get('excerpt','')[:120]}\n"
        else:
            reply += f"No se encontraron repositorios de GitHub en los últimos {record.days} días para **{topic}**."
    else:
        # Generic: surface the top feed items
        top = feeds[:4]
        if top:
            reply += f"Señales más relevantes para *{msg}* sobre **{topic}**:\n\n"
            for item in top:
                reply += f"- **[{item['title']}]({item['url']})** [{item['source']}]\n"
        else:
            reply += (
                f"Contexto sobre **{topic}** (últimos {record.days} d): "
                f"{insights[:400] if insights else 'Sin datos adicionales.'}"
            )

    return {"task_id": task_id, "message": msg, "reply": reply, "response": reply}


# ─── Health ───────────────────────────────────────────────────────────────── #

@router.get("/health")
async def health_check():
    import shutil
    skill_path  = settings.resolved_skill_path
    script_path = os.path.join(skill_path, "scripts", "last30days.py")

    return {
        "status":   "healthy",
        "app_name": "Signal — 30-Day Intelligence Hub",
        "python":   sys.executable,
        "skill": {
            "path":          skill_path,
            "exists":        os.path.exists(skill_path),
            "script_exists": os.path.exists(script_path),
        },
        "config": {
            "cache_ttl_hours":    settings.CACHE_TTL_HOURS,
            "timeout_seconds":    settings.TIMEOUT_SECONDS,
            "has_openai_key":     bool(settings.OPENAI_API_KEY),
            "has_anthropic_key":  bool(settings.ANTHROPIC_API_KEY),
            "has_gemini_key":     bool(settings.GEMINI_API_KEY),
        },
    }


import sys   # noqa: E402 — needed by health_check above
