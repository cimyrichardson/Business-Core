import hashlib
import hmac
import json
import re
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.channels.service import (
    InboundMessage,
    SUPPORTED_CHANNELS,
    handle_inbound_message,
)
from app.config import get_settings
from app.database import get_database_session
from app.dependencies import get_business_id
from app.schemas import (
    ChannelKey,
    ChannelLinkCreate,
    ChannelLinkCreated,
    ChannelLinkRead,
)

router = APIRouter(prefix="/channels", tags=["channels"])
MAX_WEBHOOK_BODY_BYTES = 2_000_000


def _channel_is_configured(channel: ChannelKey) -> bool:
    settings = get_settings()
    if channel == "telegram":
        return bool(
            settings.telegram_bot_token
            and settings.telegram_webhook_secret
        )
    return bool(
        settings.whatsapp_access_token
        and settings.whatsapp_app_secret
        and settings.whatsapp_verify_token
        and settings.whatsapp_phone_number_id
        and re.fullmatch(r"\d+", settings.whatsapp_phone_number_id)
        and settings.whatsapp_graph_api_version
        and re.fullmatch(r"v\d+\.\d+", settings.whatsapp_graph_api_version)
    )


@router.get("/links", response_model=list[ChannelLinkRead])
def list_channel_links(
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> list[ChannelLinkRead]:
    contacts = db.scalars(
        select(models.Contact)
        .where(
            models.Contact.business_id == business_id,
            models.Contact.is_active.is_(True),
            models.Contact.channel.in_(SUPPORTED_CHANNELS),
        )
        .order_by(models.Contact.channel, models.Contact.created_at)
    )
    by_channel = {contact.channel: contact for contact in contacts}
    return [
        ChannelLinkRead(
            channel=channel,
            connected=channel in by_channel,
            name=by_channel[channel].name if channel in by_channel else None,
            linked_at=(
                by_channel[channel].created_at if channel in by_channel else None
            ),
        )
        for channel in SUPPORTED_CHANNELS
    ]


@router.post(
    "/links",
    response_model=ChannelLinkCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_channel_link(
    payload: ChannelLinkCreate,
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> ChannelLinkCreated:
    if not _channel_is_configured(payload.channel):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{payload.channel.capitalize()} poko konfigire sou sèvè a.",
        )
    now = datetime.now(timezone.utc)
    settings = get_settings()
    ttl = min(max(settings.channel_link_ttl_seconds, 60), 1800)
    code = secrets.token_urlsafe(24)
    db.query(models.ChannelLinkToken).filter(
        models.ChannelLinkToken.business_id == business_id,
        models.ChannelLinkToken.channel == payload.channel,
        models.ChannelLinkToken.consumed_at.is_(None),
    ).update(
        {models.ChannelLinkToken.consumed_at: now},
        synchronize_session=False,
    )
    expires_at = now + timedelta(seconds=ttl)
    db.add(
        models.ChannelLinkToken(
            business_id=business_id,
            channel=payload.channel,
            token_hash=hashlib.sha256(code.encode("utf-8")).hexdigest(),
            expires_at=expires_at,
        )
    )
    db.commit()
    return ChannelLinkCreated(
        channel=payload.channel,
        code=code,
        expires_at=expires_at,
    )


@router.delete("/links/{channel}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_channel_link(
    channel: ChannelKey,
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> None:
    contact = db.scalar(
        select(models.Contact)
        .where(
            models.Contact.business_id == business_id,
            models.Contact.channel == channel,
            models.Contact.is_active.is_(True),
        )
        .with_for_update()
    )
    if contact is not None:
        contact.is_active = False
        db.commit()
@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_database_session),
) -> dict[str, bool]:
    settings = get_settings()
    secret = settings.telegram_webhook_secret
    received_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if not secret or not hmac.compare_digest(received_secret, secret):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook Telegram sa a pa otantifye.",
        )

    raw_body = await request.body()
    if len(raw_body) > MAX_WEBHOOK_BODY_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Mesaj webhook la twò gwo.",
        )
    try:
        update = json.loads(raw_body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram voye done nou pa ka li.",
        ) from error
    if not isinstance(update, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fòma webhook Telegram nan pa valab.",
        )

    incoming = update.get("message")
    if not isinstance(incoming, dict):
        return {"ok": True}
    chat = incoming.get("chat")
    sender = incoming.get("from")
    if not isinstance(chat, dict) or not isinstance(sender, dict):
        return {"ok": True}
    if chat.get("type") != "private":
        return {"ok": True}

    sender_id = sender.get("id")
    chat_id = chat.get("id")
    message_id = incoming.get("message_id")
    if not all(isinstance(value, (str, int)) for value in (sender_id, chat_id, message_id)):
        return {"ok": True}

    text = incoming.get("text")
    audio_id = None
    audio_mime_type = "audio/ogg"
    voice = incoming.get("voice")
    audio = incoming.get("audio")
    media = voice if isinstance(voice, dict) else audio
    if isinstance(media, dict):
        audio_id = media.get("file_id")
        mime_type = media.get("mime_type")
        if isinstance(mime_type, str):
            audio_mime_type = mime_type
        if not isinstance(audio_id, str):
            audio_id = None
    if not isinstance(text, str):
        text = None

    update_message = InboundMessage(
        channel="telegram",
        external_message_id=f"{chat_id}:{message_id}",
        sender_id=str(sender_id),
        reply_id=str(chat_id),
        text=text,
        audio_id=audio_id,
        audio_mime_type=audio_mime_type,
        sender_name=(
            " ".join(
                part
                for part in (sender.get("first_name"), sender.get("last_name"))
                if isinstance(part, str) and part.strip()
            )[:120]
            or None
        ),
    )
    await run_in_threadpool(
        handle_inbound_message,
        update_message,
        db,
        settings,
    )
    return {"ok": True}


@router.get("/whatsapp/webhook", response_class=PlainTextResponse)
def verify_whatsapp_webhook(
    mode: str | None = Query(default=None, alias="hub.mode"),
    token: str | None = Query(default=None, alias="hub.verify_token"),
    challenge: str | None = Query(default=None, alias="hub.challenge"),
) -> PlainTextResponse:
    settings = get_settings()
    if (
        mode != "subscribe"
        or not settings.whatsapp_verify_token
        or token is None
        or not hmac.compare_digest(token, settings.whatsapp_verify_token)
        or challenge is None
        or len(challenge) > 256
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verifikasyon webhook WhatsApp la echwe.",
        )
    return PlainTextResponse(challenge)


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_database_session),
) -> dict[str, bool]:
    settings = get_settings()
    app_secret = settings.whatsapp_app_secret
    signature = request.headers.get("X-Hub-Signature-256", "")
    raw_body = await request.body()
    if len(raw_body) > MAX_WEBHOOK_BODY_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Mesaj webhook la twò gwo.",
        )
    if not app_secret or not re.fullmatch(r"sha256=[0-9a-fA-F]{64}", signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook WhatsApp sa a pa otantifye.",
        )
    expected_signature = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook WhatsApp sa a pa otantifye.",
        )

    try:
        payload = json.loads(raw_body)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WhatsApp voye done nou pa ka li.",
        ) from error
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fòma webhook WhatsApp la pa valab.",
        )

    entry_list = payload.get("entry", [])
    if not isinstance(entry_list, list):
        return {"ok": True}
    for entry in entry_list:
        if not isinstance(entry, dict):
            continue
        changes = entry.get("changes", [])
        if not isinstance(changes, list):
            continue
        for change in changes:
            if not isinstance(change, dict):
                continue
            value = change.get("value")
            if not isinstance(value, dict):
                continue
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])
            contacts_by_id = {
                item.get("wa_id"): item
                for item in contacts
                if isinstance(item, dict) and isinstance(item.get("wa_id"), str)
            } if isinstance(contacts, list) else {}
            if not isinstance(messages, list):
                continue
            for incoming in messages:
                if not isinstance(incoming, dict):
                    continue
                sender_id = incoming.get("from")
                message_id = incoming.get("id")
                if not isinstance(sender_id, str) or not isinstance(message_id, str):
                    continue
                message_type = incoming.get("type")
                text = None
                audio_id = None
                audio_mime_type = "audio/ogg"
                if message_type == "text":
                    text_payload = incoming.get("text")
                    if isinstance(text_payload, dict) and isinstance(
                        text_payload.get("body"), str
                    ):
                        text = text_payload["body"]
                elif message_type == "audio":
                    audio_payload = incoming.get("audio")
                    if isinstance(audio_payload, dict):
                        media_id = audio_payload.get("id")
                        mime_type = audio_payload.get("mime_type")
                        audio_id = media_id if isinstance(media_id, str) else None
                        if isinstance(mime_type, str):
                            audio_mime_type = mime_type

                contact_payload = contacts_by_id.get(sender_id, {})
                profile = contact_payload.get("profile", {})
                name = profile.get("name") if isinstance(profile, dict) else None
                update_message = InboundMessage(
                    channel="whatsapp",
                    external_message_id=message_id,
                    sender_id=sender_id,
                    reply_id=sender_id,
                    text=text,
                    audio_id=audio_id,
                    audio_mime_type=audio_mime_type,
                    sender_name=name if isinstance(name, str) else None,
                )
                await run_in_threadpool(
                    handle_inbound_message,
                    update_message,
                    db,
                    settings,
                )
    return {"ok": True}
