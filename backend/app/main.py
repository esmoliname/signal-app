from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.api.endpoints import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Signal — 30-Day Intelligence Hub API",
    description="Wrapper around the last30days skill. Real data, no simulations.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS: open for local development (Vite :5173, direct :8000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "app": "Signal — 30-Day Intelligence Hub",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
