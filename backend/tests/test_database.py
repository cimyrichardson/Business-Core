from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.exc import OperationalError

from app import database
from app.auth import get_current_user_id
from app.main import api, app

TEST_USER_ID = UUID("f0ab12e3-1d3f-4f06-9000-36ec38b6ab10")


def test_missing_database_url_returns_configuration_instructions(monkeypatch):
    monkeypatch.setattr(
        database,
        "get_settings",
        lambda: SimpleNamespace(database_url=None),
    )

    with pytest.raises(HTTPException) as raised:
        next(database.get_database_session())

    assert raised.value.status_code == 503
    assert "DATABASE_URL" in raised.value.detail
    assert "backend/.env" in raised.value.detail


def test_database_connection_failure_is_returned_with_cors_headers(monkeypatch):
    engine = create_engine("sqlite+pysqlite://")

    @event.listens_for(engine, "before_cursor_execute")
    def fail_database_query(
        connection,
        cursor,
        statement,
        parameters,
        context,
        executemany,
    ):
        raise OperationalError(
            statement,
            parameters,
            RuntimeError("database unavailable"),
        )

    monkeypatch.setattr(
        database,
        "get_settings",
        lambda: SimpleNamespace(database_url="sqlite+pysqlite://"),
    )
    monkeypatch.setattr(database, "_get_engine", lambda _: engine)
    api.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID

    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/products",
                headers={"Origin": "http://localhost:3000"},
            )
    finally:
        api.dependency_overrides.clear()
        engine.dispose()

    assert response.status_code == 503
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )
    assert "DATABASE_URL" in response.json()["detail"]
