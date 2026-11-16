from datetime import date

from app.periods import period_dates


def test_seven_day_period_includes_today_and_six_previous_days():
    assert period_dates("7days", date(2026, 11, 16)) == (
        date(2026, 11, 10),
        date(2026, 11, 16),
    )


def test_month_period_starts_on_first_day_of_month():
    assert period_dates("month", date(2026, 11, 16)) == (
        date(2026, 11, 1),
        date(2026, 11, 16),
    )


def test_thirty_day_period_includes_today_and_twenty_nine_previous_days():
    assert period_dates("30days", date(2026, 11, 16)) == (
        date(2026, 10, 18),
        date(2026, 11, 16),
    )
