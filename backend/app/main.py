import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401  (register models on Base.metadata)
from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.contact import router as contact_router
from app.api.v1.routers.health import router as health_router
from app.api.v1.routers.budget import router as budget_router
from app.api.v1.routers.ledgers import profile_router, router as ledgers_router
from app.config.settings import settings
from app.core.cors import setup_cors
from app.db.database import Base, engine
from sqlalchemy import text

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE budget_transactions ADD COLUMN IF NOT EXISTS "
                "updated_at TIMESTAMPTZ DEFAULT NOW()"
            ))
            conn.execute(text(
                "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "
                "email_verified BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            conn.execute(text(
                "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "
                "email_verification_token VARCHAR(128)"
            ))
            conn.execute(text(
                "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "
                "email_verification_expires TIMESTAMPTZ"
            ))
            conn.commit()
    except Exception as exc:  # pragma: no cover
        logger.warning("Skipping table creation (database unavailable): %s", exc)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

setup_cors(app)

app.include_router(health_router, tags=["Health"])
app.include_router(contact_router, prefix=settings.api_v1_prefix, tags=["Contact"])
app.include_router(auth_router, prefix=settings.api_v1_prefix, tags=["Auth"])
app.include_router(budget_router, prefix=settings.api_v1_prefix, tags=["Budget"])
app.include_router(ledgers_router, prefix=settings.api_v1_prefix, tags=["Ledgers"])
app.include_router(profile_router, prefix=settings.api_v1_prefix, tags=["Profiles"])
