import hashlib
import hmac
import json
from base64 import b64encode
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest

from app import models
from app.channels import providers
from app.models import ChannelLinkToken, ChannelMessage, Contact


def _channel_settings(monkeypatch, **overrides):
    values = {
        "channel_link_ttl_seconds": 900,
        "channel_processing_lease_seconds": 120,
        "channel_provider_timeout_seconds": 1,
        "channel_max_audio_bytes": 1000,
        "telegram_bot_token": "test-telegram-token",
        "telegram_webhook_secret": "telegram-test-secret",
        "whatsapp_access_token": "test-whatsapp-token",
        "whatsapp_app_secret": "whatsapp-test-secret",
        "whatsapp_verify_token": "whatsapp-verify-test",
        "whatsapp_phone_number_id": "test-phone-id",
        "whatsapp_graph_api_version": "v99.0",
        "gemini_api_key": "test-gemini-key",
        "gemini_audio_model": "test-audio-model",
    }
    values.update(overrides)
    monkeypatch.setattr(
        "app.routes.channels.get_settings",
        lambda: SimpleNamespace(**values),
    )
    return SimpleNamespace(**values)


def test_link_code_connects_telegram_and_message_is_deduplicated(
    api_client,
    monkeypatch,
):
    client, session, business_id = api_client
    settings = _channel_settings(monkeypatch)
    sent_messages = []
    monkeypatch.setattr(
        providers,
        "send_message",
        lambda channel, recipient_id, text, settings: sent_messages.append(
            (channel, recipient_id, text)
        ),
    )

    link_response = client.post(
        "/api/v1/channels/links",
        json={"channel": "telegram"},
    )
    assert link_response.status_code == 201
    code = link_response.json()["code"]
    token = session.query(ChannelLinkToken).one()
    assert token.business_id == business_id
    assert token.token_hash == hashlib.sha256(code.encode()).hexdigest()
    assert token.token_hash != code

    update = {
        "update_id": 101,
        "message": {
            "message_id": 22,
            "chat": {"id": 555, "type": "private"},
            "from": {"id": 777, "first_name": "Tès"},
            "text": f"/link {code}",
        },
    }
    headers = {"X-Telegram-Bot-Api-Secret-Token": settings.telegram_webhook_secret}
    first = client.post(
        "/api/v1/channels/telegram/webhook",
        json=update,
        headers=headers,
    )
    second = client.post(
        "/api/v1/channels/telegram/webhook",
        json=update,
        headers=headers,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert session.query(Contact).filter_by(
        business_id=business_id,
        channel="telegram",
        external_id="777",
        is_active=True,
    ).count() == 1
    session.refresh(token)
    assert token.consumed_at is not None
    assert len(sent_messages) == 1
    assert session.query(ChannelMessage).filter_by(
        channel="telegram",
        external_message_id="555:22",
        status="processed",
    ).count() == 1


def test_telegram_webhook_rejects_missing_or_invalid_secret(api_client, monkeypatch):
    client, _, _ = api_client
    _channel_settings(monkeypatch)
    response = client.post(
        "/api/v1/channels/telegram/webhook",
        json={"update_id": 1},
        headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"},
    )
    assert response.status_code == 403


def test_link_cannot_be_created_when_provider_is_not_configured(
    api_client,
    monkeypatch,
):
    client, session, _ = api_client
    _channel_settings(monkeypatch, telegram_bot_token=None)

    response = client.post(
        "/api/v1/channels/links",
        json={"channel": "telegram"},
    )

    assert response.status_code == 503
    assert session.query(ChannelLinkToken).count() == 0


def test_link_code_expires_and_cannot_be_consumed(api_client, monkeypatch):
    client, session, _ = api_client
    settings = _channel_settings(monkeypatch)
    expired_code = "Expired-channel-link-code-00001"
    business_id = session.query(models.BusinessMember).one().business_id
    session.add(
        ChannelLinkToken(
            business_id=business_id,
            channel="telegram",
            token_hash=hashlib.sha256(expired_code.encode()).hexdigest(),
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
    )
    session.commit()
    sent_messages = []
    monkeypatch.setattr(
        providers,
        "send_message",
        lambda channel, recipient_id, text, settings: sent_messages.append(text),
    )

    response = client.post(
        "/api/v1/channels/telegram/webhook",
        json={
            "message": {
                "message_id": 1,
                "chat": {"id": 555, "type": "private"},
                "from": {"id": 777},
                "text": f"/link {expired_code}",
            }
        },
        headers={
            "X-Telegram-Bot-Api-Secret-Token": settings.telegram_webhook_secret,
        },
    )

    assert response.status_code == 200
    assert "ekspire" in sent_messages[0].lower()
    assert session.query(Contact).count() == 0


def test_whatsapp_webhook_verification_and_signature(api_client, monkeypatch):
    client, _, _ = api_client
    settings = _channel_settings(monkeypatch)
    challenge = client.get(
        "/api/v1/channels/whatsapp/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": settings.whatsapp_verify_token,
            "hub.challenge": "challenge-token",
        },
    )
    assert challenge.status_code == 200
    assert challenge.text == "challenge-token"

    sent_messages = []
    monkeypatch.setattr(
        providers,
        "send_message",
        lambda channel, recipient_id, text, settings: sent_messages.append(text),
    )
    body = json.dumps(
        {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "changes": [
                        {
                            "value": {
                                "messages": [
                                    {
                                        "id": "wamid-test-001",
                                        "from": "50900000000",
                                        "type": "text",
                                        "text": {"body": "ede"},
                                    }
                                ]
                            }
                        }
                    ]
                }
            ],
        }
    ).encode()
    signature = hmac.new(
        settings.whatsapp_app_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    invalid = client.post(
        "/api/v1/channels/whatsapp/webhook",
        content=body,
        headers={"X-Hub-Signature-256": f"sha256={'0' * 64}"},
    )
    valid = client.post(
        "/api/v1/channels/whatsapp/webhook",
        content=body,
        headers={"X-Hub-Signature-256": f"sha256={signature}"},
    )

    assert invalid.status_code == 403
    assert valid.status_code == 200
    assert "konekte kont sa a" in sent_messages[0].lower()


def test_audio_transcription_rejects_unsupported_media_without_network(
    monkeypatch,
):
    settings = _channel_settings(monkeypatch)

    def unexpected_http_client(*args, **kwargs):
        raise AssertionError("Unsupported audio must be rejected before network access")

    monkeypatch.setattr(providers.httpx, "Client", unexpected_http_client)
    with pytest.raises(providers.ChannelProviderError, match="Fòma odyo"):
        providers.transcribe_audio(
            "telegram",
            "file-id",
            "application/octet-stream",
            settings,
        )


def test_telegram_voice_is_transcribed_then_sent_to_command_router(
    api_client,
    monkeypatch,
):
    client, session, business_id = api_client
    settings = _channel_settings(monkeypatch)
    contact = Contact(
        business_id=business_id,
        channel="telegram",
        external_id="777",
        name="Tès",
        is_active=True,
    )
    session.add(contact)
    session.commit()

    transcribed = []
    sent_messages = []
    monkeypatch.setattr(
        providers,
        "transcribe_audio",
        lambda channel, file_id, mime_type, settings: (
            transcribed.append((channel, file_id, mime_type)) or "ede"
        ),
    )
    monkeypatch.setattr(
        providers,
        "send_message",
        lambda channel, recipient_id, text, settings: sent_messages.append(text),
    )

    response = client.post(
        "/api/v1/channels/telegram/webhook",
        json={
            "message": {
                "message_id": 25,
                "chat": {"id": 555, "type": "private"},
                "from": {"id": 777},
                "voice": {
                    "file_id": "telegram-audio-123",
                    "mime_type": "audio/ogg",
                },
            }
        },
        headers={
            "X-Telegram-Bot-Api-Secret-Token": settings.telegram_webhook_secret,
        },
    )

    assert response.status_code == 200
    assert transcribed == [("telegram", "telegram-audio-123", "audio/ogg")]
    assert "voye: rezime" in sent_messages[0].lower()


def test_deterministic_product_command_is_scoped_to_linked_business(
    api_client,
    monkeypatch,
):
    client, session, business_id = api_client
    settings = _channel_settings(monkeypatch)
    other_business = models.Business(id=uuid4(), name="Lòt biznis")
    session.add(other_business)
    session.add(
        models.Product(
            business_id=other_business.id,
            name="Done prive",
            unit_price_htg=999,
            stock_quantity=9,
        )
    )
    session.add(
        Contact(
            business_id=business_id,
            channel="telegram",
            external_id="777",
            is_active=True,
        )
    )
    session.commit()

    replies = []
    monkeypatch.setattr(
        providers,
        "send_message",
        lambda channel, recipient_id, text, settings: replies.append(text),
    )
    response = client.post(
        "/api/v1/channels/telegram/webhook",
        json={
            "message": {
                "message_id": 26,
                "chat": {"id": 555, "type": "private"},
                "from": {"id": 777},
                "text": "pwodwi",
            }
        },
        headers={
            "X-Telegram-Bot-Api-Secret-Token": settings.telegram_webhook_secret,
        },
    )

    assert response.status_code == 200
    assert "Diri 1 kg" in replies[0]
    assert "Done prive" not in replies[0]


def test_gemini_audio_transcription_uses_server_key_and_returns_text(
    monkeypatch,
):
    settings = _channel_settings(monkeypatch)
    monkeypatch.setattr(
        providers,
        "_download_telegram_audio",
        lambda file_id, settings: b"voice-bytes",
    )
    requests = []
    transport = httpx.MockTransport(
        lambda request: (
            requests.append(request)
            or httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [{"text": "Ki pwodwi ki prèske fini?"}]
                            }
                        }
                    ]
                },
            )
        )
    )
    original_client = httpx.Client
    monkeypatch.setattr(
        providers.httpx,
        "Client",
        lambda timeout: original_client(transport=transport, timeout=timeout),
    )

    transcript = providers.transcribe_audio(
        "telegram",
        "audio-file-id",
        "audio/ogg; codecs=opus",
        settings,
    )

    assert transcript == "Ki pwodwi ki prèske fini?"
    assert len(requests) == 1
    assert requests[0].headers["x-goog-api-key"] == settings.gemini_api_key
    request_payload = json.loads(requests[0].content)
    audio_part = request_payload["contents"][0]["parts"][1]["inline_data"]
    assert audio_part["data"] == b64encode(b"voice-bytes").decode("ascii")
    assert audio_part["mime_type"] == "audio/ogg"
