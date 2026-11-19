import hashlib
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models
from app.channels import providers
from app.config import Settings
from app.periods import period_dates
from app.routes.dashboard import get_summary
from app.routes.products import list_low_stock, list_products
from app.schemas import ChannelKey, PeriodKey

SUPPORTED_CHANNELS: tuple[ChannelKey, ...] = ("whatsapp", "telegram")


@dataclass(frozen=True)
class InboundMessage:
    channel: ChannelKey
    external_message_id: str
    sender_id: str
    reply_id: str
    text: str | None = None
    audio_id: str | None = None
    audio_mime_type: str = "audio/ogg"
    sender_name: str | None = None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalized_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    without_accents = "".join(
        character
        for character in decomposed
        if not unicodedata.combining(character)
    )
    return re.sub(r"\s+", " ", without_accents).strip()


def _period_for_text(text: str) -> tuple[PeriodKey, str]:
    normalized = _normalized_text(text)
    if "mwa sa" in normalized or "month" in normalized:
        return "month", "mwa sa a"
    if "semen sa" in normalized or "7 jou" in normalized or "7days" in normalized:
        return "7days", "7 dènye jou yo"
    return "30days", "30 dènye jou yo"


def _help_message() -> str:
    return (
        "Mwen ka ede w ak biznis ou. Voye: rezime, vant, depans, "
        "pwodwi oswa stok. Ou ka ajoute 'semèn sa a' oswa 'mwa sa a' "
        "pou chwazi peryòd la."
    )


def _link_code_from_text(text: str) -> str | None:
    parts = text.strip().split(maxsplit=1)
    if len(parts) != 2 or _normalized_text(parts[0]).lstrip("/") != "link":
        return None
    code = parts[1].strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{20,100}", code):
        return None
    return code


def _claim_message(
    db: Session,
    message: InboundMessage,
    settings: Settings,
) -> tuple[models.ChannelMessage | None, bool]:
    now = _utc_now()
    record = db.scalar(
        select(models.ChannelMessage)
        .where(
            models.ChannelMessage.channel == message.channel,
            models.ChannelMessage.external_message_id
            == message.external_message_id,
        )
        .with_for_update()
    )
    if record is not None:
        if record.status == "processed":
            return record, False
        received_at = record.received_at
        if received_at.tzinfo is None:
            received_at = received_at.replace(tzinfo=timezone.utc)
        if (
            record.status == "processing"
            and now - received_at
            < timedelta(seconds=settings.channel_processing_lease_seconds)
        ):
            return record, False
        record.status = "processing"
        record.received_at = now
        record.processed_at = None
        db.commit()
        return record, True

    record = models.ChannelMessage(
        channel=message.channel,
        external_message_id=message.external_message_id,
        status="processing",
        received_at=now,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(models.ChannelMessage).where(
                models.ChannelMessage.channel == message.channel,
                models.ChannelMessage.external_message_id
                == message.external_message_id,
            )
        )
        return existing, False
    return record, True


def _link_contact(
    db: Session,
    channel: ChannelKey,
    sender_id: str,
    sender_name: str | None,
    code: str,
) -> str:
    now = _utc_now()
    token_digest = hashlib.sha256(code.encode("utf-8")).hexdigest()
    token = db.scalar(
        select(models.ChannelLinkToken)
        .where(
            models.ChannelLinkToken.channel == channel,
            models.ChannelLinkToken.token_hash == token_digest,
        )
        .with_for_update()
    )
    if token is None or token.consumed_at is not None:
        return "Kòd koneksyon sa a pa valab oswa li deja itilize."

    expires_at = token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        return "Kòd koneksyon an ekspire. Kreye yon lòt kòd nan sit la."

    contact = db.scalar(
        select(models.Contact)
        .where(
            models.Contact.channel == channel,
            models.Contact.external_id == sender_id,
            models.Contact.is_active.is_(True),
        )
        .with_for_update()
    )
    if contact is not None and contact.business_id != token.business_id:
        return (
            "Kont chanèl sa a deja konekte ak yon lòt biznis. "
            "Dekonekte li anvan ou kontinye."
        )
    if contact is None:
        contact = db.scalar(
            select(models.Contact)
            .where(
                models.Contact.business_id == token.business_id,
                models.Contact.channel == channel,
                models.Contact.external_id == sender_id,
            )
            .with_for_update()
        )
    if contact is None:
        contact = models.Contact(
            business_id=token.business_id,
            channel=channel,
            external_id=sender_id,
            name=sender_name[:120] if sender_name else None,
            is_active=True,
        )
        db.add(contact)
    else:
        contact.name = sender_name[:120] if sender_name else contact.name
        contact.is_active = True
    token.consumed_at = now
    db.commit()
    return "Kont ou konekte avèk siksè. Voye 'èd' pou wè sa mwen ka fè."


def _period_label(start_date, end_date, label: str) -> str:
    return f"{label} ({start_date.isoformat()} → {end_date.isoformat()})"


def _command_reply(
    text: str,
    business_id: UUID,
    db: Session,
) -> str:
    normalized = _normalized_text(text)
    if normalized in {"help", "start", "ed", "koman", "/start"}:
        return _help_message()

    if any(word in normalized for word in ("stok", "stock", "preske fini")):
        products = list_low_stock(business_id=business_id, db=db)
        if not products:
            return "Tout pwodwi yo gen ase stòk pou kounye a."
        lines = [
            f"• {product.name}: {product.stock_quantity} rete "
            f"(minimòm {product.min_stock_quantity})"
            for product in products[:15]
        ]
        return "Men pwodwi ki prèske fini:\n" + "\n".join(lines)

    if "pwodwi" in normalized or "product" in normalized:
        products = list_products(limit=20, offset=0, business_id=business_id, db=db)
        if not products:
            return "Pa gen pwodwi ki anrejistre pou biznis sa a."
        lines = [
            f"• {product.name}: {product.stock_quantity} an stòk, "
            f"{product.unit_price_htg} HTG"
            for product in products[:15]
        ]
        return "Men kèk pwodwi nan biznis ou:\n" + "\n".join(lines)

    if any(
        word in normalized
        for word in ("rezime", "resume", "bilan", "vant", "depans", "chif dafe")
    ):
        period, label = _period_for_text(normalized)
        summary = get_summary(period=period, business_id=business_id, db=db)
        start_date, end_date = period_dates(period)
        formatted_period = _period_label(start_date, end_date, label)
        if "depans" in normalized:
            return (
                f"Pou {formatted_period}, depans yo se "
                f"{summary.expenses_total_htg:,} HTG."
            )
        if "vant" in normalized or "chif dafe" in normalized:
            return (
                f"Pou {formatted_period}, ou fè {summary.sales_count} vant, "
                f"ak {summary.revenue_htg:,} HTG chif dafè."
            )
        return (
            f"Rezime pou {formatted_period}:\n"
            f"• Chif dafè: {summary.revenue_htg:,} HTG\n"
            f"• Depans: {summary.expenses_total_htg:,} HTG\n"
            f"• Kantite vant: {summary.sales_count}\n"
            f"• Pwodwi ki prèske fini: {summary.low_stock_count}"
        )
    return _help_message()


def _handle_text(
    message: InboundMessage,
    db: Session,
) -> tuple[UUID | None, str]:
    code = _link_code_from_text(message.text or "")
    if code:
        return None, _link_contact(
            db,
            message.channel,
            message.sender_id,
            message.sender_name,
            code,
        )

    contact = db.scalar(
        select(models.Contact).where(
            models.Contact.channel == message.channel,
            models.Contact.external_id == message.sender_id,
            models.Contact.is_active.is_(True),
        )
    )
    if contact is None:
        return (
            None,
            "Pou pwoteje done biznis ou, konekte kont sa a nan seksyon "
            "'Mesaj ak rapò' sou sit Business Core la.",
        )
    if message.text is None:
        return contact.id, _help_message()
    if len(message.text) > 2000:
        return contact.id, "Mesaj la twò long. Tanpri voye yon demann pi kout."
    return contact.id, _command_reply(message.text, contact.business_id, db)


def handle_inbound_message(
    message: InboundMessage,
    db: Session,
    settings: Settings,
) -> bool:
    record, should_process = _claim_message(db, message, settings)
    if not should_process or record is None:
        return False

    try:
        text = message.text
        if message.audio_id:
            contact = db.scalar(
                select(models.Contact).where(
                    models.Contact.channel == message.channel,
                    models.Contact.external_id == message.sender_id,
                    models.Contact.is_active.is_(True),
                )
            )
            if contact is None:
                providers.send_message(
                    message.channel,
                    message.reply_id,
                    (
                        "Pou pwoteje done biznis ou, konekte kont sa a nan "
                        "seksyon 'Mesaj ak rapò' sou sit Business Core la."
                    ),
                    settings,
                )
                record.status = "processed"
                record.processed_at = _utc_now()
                db.commit()
                return True
            try:
                text = providers.transcribe_audio(
                    message.channel,
                    message.audio_id,
                    message.audio_mime_type,
                    settings,
                )
            except providers.ChannelProviderError:
                record.contact_id = contact.id
                providers.send_message(
                    message.channel,
                    message.reply_id,
                    "Mwen pa rive konprann odyo a. Tanpri voye yon mesaj tèks.",
                    settings,
                )
                record.status = "processed"
                record.processed_at = _utc_now()
                db.commit()
                return True

        message_to_handle = InboundMessage(
            channel=message.channel,
            external_message_id=message.external_message_id,
            sender_id=message.sender_id,
            reply_id=message.reply_id,
            text=text,
            sender_name=message.sender_name,
        )
        contact_id, reply = _handle_text(message_to_handle, db)
        record.contact_id = contact_id
        providers.send_message(
            message.channel,
            message.reply_id,
            reply,
            settings,
        )
        record.status = "processed"
        record.processed_at = _utc_now()
        db.commit()
        return True
    except Exception:
        db.rollback()
        failed_record = db.scalar(
            select(models.ChannelMessage).where(
                models.ChannelMessage.channel == message.channel,
                models.ChannelMessage.external_message_id
                == message.external_message_id,
            )
        )
        if failed_record is not None:
            failed_record.status = "failed"
            db.commit()
        raise
