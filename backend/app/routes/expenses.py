from datetime import datetime, time
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.dependencies import get_business_id
from app.models import Expense
from app.periods import BUSINESS_TIMEZONE, period_datetimes, period_dates
from app.schemas import ExpenseCreate, ExpenseRead, PeriodKey

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseRead])
def list_expenses(
    period: PeriodKey = Query(default="30days"),
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> list[Expense]:
    start_date, end_date = period_dates(period)
    start_at, end_at = period_datetimes(start_date, end_date)
    return list(
        db.scalars(
            select(Expense)
            .where(
                Expense.business_id == business_id,
                Expense.spent_at >= start_at,
                Expense.spent_at < end_at,
            )
            .order_by(Expense.spent_at.desc(), Expense.id)
            .limit(limit)
            .offset(offset)
        )
    )


@router.post(
    "",
    response_model=ExpenseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    payload: ExpenseCreate,
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> Expense:
    spent_at = datetime.combine(
        payload.spent_at,
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )
    expense = Expense(
        business_id=business_id,
        amount_htg=payload.amount_htg,
        category=payload.category,
        spent_at=spent_at,
        description=payload.description,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
