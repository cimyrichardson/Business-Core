from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.schemas import PeriodKey

BUSINESS_TIMEZONE = ZoneInfo("America/Port-au-Prince")


def period_dates(
    period: PeriodKey,
    today: date | None = None,
) -> tuple[date, date]:
    end_date = today or datetime.now(BUSINESS_TIMEZONE).date()

    if period == "7days":
        start_date = end_date - timedelta(days=6)
    elif period == "month":
        start_date = end_date.replace(day=1)
    else:
        start_date = end_date - timedelta(days=29)

    return start_date, end_date


def period_datetimes(
    start_date: date,
    end_date: date,
) -> tuple[datetime, datetime]:
    start_at = datetime.combine(start_date, datetime.min.time()).replace(
        tzinfo=BUSINESS_TIMEZONE,
    )
    end_at = datetime.combine(
        end_date + timedelta(days=1),
        datetime.min.time(),
    ).replace(tzinfo=BUSINESS_TIMEZONE)
    return start_at.astimezone(timezone.utc), end_at.astimezone(timezone.utc)
