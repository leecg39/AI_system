# @TASK P0-T0.3 - FastAPI application entry point
# @SPEC docs/planning/02-trd.md#backend-init
"""FastAPI application with authentication, CORS, and WebSocket support."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import ws
from app.api.v1.endpoints import api_v1_router
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    logger.info("Application startup")
    # Auto-create tables for SQLite dev mode
    if settings.DATABASE_URL.startswith("sqlite"):
        from app.db.session import engine
        from app.db.base import Base
        # Import all models so they are registered
        import app.models.user  # noqa: F401
        import app.models.team  # noqa: F401
        import app.models.agent  # noqa: F401
        import app.models.task  # noqa: F401
        import app.models.task_result  # noqa: F401
        import app.models.task_log  # noqa: F401
        import app.models.team_template  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite tables created for dev mode")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - restricted to configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routers
app.include_router(api_v1_router)
app.include_router(ws.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {"status": "healthy"}


# WebSocket connections registry (for future real-time features)
active_connections: list[WebSocket] = []


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication.

    This is a placeholder that will be expanded in later phases
    for features like live AI chat streaming.
    """
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now; will be replaced with real handlers
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")
