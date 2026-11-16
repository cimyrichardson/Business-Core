import asyncio
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app import auth

TEST_USER_ID = UUID("f0ab12e3-1d3f-4f06-9000-36ec38b6ab10")


class FakeResponse:
    def __init__(self, status_code: int, payload: dict[str, str]) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict[str, str]:
        return self._payload


class FakeAsyncClient:
    response = FakeResponse(200, {"id": str(TEST_USER_ID)})
    requested_url = ""
    requested_headers: dict[str, str] = {}

    def __init__(self, timeout: float) -> None:
        self.timeout = timeout

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def get(
        self,
        url: str,
        headers: dict[str, str],
    ) -> FakeResponse:
        FakeAsyncClient.requested_url = url
        FakeAsyncClient.requested_headers = headers
        return self.response


def test_supabase_access_token_is_verified_using_auth_user_endpoint(monkeypatch):
    FakeAsyncClient.response = FakeResponse(200, {"id": str(TEST_USER_ID)})
    monkeypatch.setattr(
        auth,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://project.supabase.co/",
            supabase_publishable_key="publishable",
            supabase_auth_timeout_seconds=3.0,
        ),
    )
    monkeypatch.setattr(auth.httpx, "AsyncClient", FakeAsyncClient)
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="access-token",
    )

    user_id = asyncio.run(auth.get_current_user_id(credentials))

    assert user_id == TEST_USER_ID
    assert FakeAsyncClient.requested_url == (
        "https://project.supabase.co/auth/v1/user"
    )
    assert FakeAsyncClient.requested_headers["apikey"] == "publishable"
    assert (
        FakeAsyncClient.requested_headers["Authorization"]
        == "Bearer access-token"
    )


def test_supabase_rejected_token_returns_unauthorized(monkeypatch):
    FakeAsyncClient.response = FakeResponse(401, {})
    monkeypatch.setattr(
        auth,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://project.supabase.co",
            supabase_publishable_key="publishable",
            supabase_auth_timeout_seconds=3.0,
        ),
    )
    monkeypatch.setattr(auth.httpx, "AsyncClient", FakeAsyncClient)
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="expired-token",
    )

    with pytest.raises(HTTPException) as raised:
        asyncio.run(auth.get_current_user_id(credentials))

    assert raised.value.status_code == 401
