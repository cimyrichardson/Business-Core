from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Konekte pou kontinye.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Otantifikasyon API a poko konfigire sou sèvè a.",
        )

    try:
        async with httpx.AsyncClient(
            timeout=settings.supabase_auth_timeout_seconds,
        ) as client:
            response = await client.get(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {credentials.credentials}",
                },
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sèvis koneksyon an pa disponib kounye a.",
        ) from error

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesyon an pa valab. Konekte ankò.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nou pa ka verifye sesyon an kounye a.",
        )

    try:
        payload = response.json()
        return UUID(payload["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sèvis koneksyon an voye yon repons nou pa ka verifye.",
        ) from error
