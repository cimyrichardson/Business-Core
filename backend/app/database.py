from collections.abc import Iterator
from functools import lru_cache

from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.config import get_settings


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


@lru_cache(maxsize=2)
def _get_engine(database_url: str) -> Engine:
    return create_engine(
        _normalize_database_url(database_url),
        pool_pre_ping=True,
    )


def get_database_session() -> Iterator[Session]:
    database_url = get_settings().database_url
    if not database_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "DATABASE_URL manke. Mete URL PostgreSQL Supabase la nan "
                "backend/.env epi rekòmanse API a."
            ),
        )

    with Session(_get_engine(database_url)) as session:
        try:
            yield session
        except OperationalError as error:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Koneksyon ak baz done a echwe. Verifye modpas ak non "
                    "itilizatè DATABASE_URL nan backend/.env."
                ),
            ) from error
