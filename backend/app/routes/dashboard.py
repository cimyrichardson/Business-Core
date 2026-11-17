from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.database import get_database_session
from app.dependencies import get_business_id
from app.models import Expense, Product, Sale
from app.periods import BUSINESS_TIMEZONE, period_datetimes, period_dates
from app.schemas import (
    DailyActivityRead,
    DashboardSummary,
    PeriodKey,
    ProductRead,
    TopProductRead,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _business_date_expression(
    column: ColumnElement[datetime],
    db: Session,
) -> ColumnElement[date]:
    if db.get_bind().dialect.name == "sqlite":
        return func.date(column)
    return func.date(func.timezone(BUSINESS_TIMEZONE.key, column))


def _as_date(value: date | str) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    period: PeriodKey = Query(default="7days"),
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> DashboardSummary:
    start_date, end_date = period_dates(period)
    start_at, end_at = period_datetimes(start_date, end_date)
    period_sales = (
        Sale.business_id == business_id,
        Sale.sold_at >= start_at,
        Sale.sold_at < end_at,
    )
    period_expenses = (
        Expense.business_id == business_id,
        Expense.spent_at >= start_at,
        Expense.spent_at < end_at,
    )

    revenue_htg = db.scalar(
        select(func.coalesce(func.sum(Sale.total_htg), 0)).where(*period_sales)
    )
    expenses_total_htg = db.scalar(
        select(func.coalesce(func.sum(Expense.amount_htg), 0)).where(
            *period_expenses
        )
    )
    sales_count = db.scalar(
        select(func.count(Sale.id)).where(*period_sales)
    )

    daily_activity: dict[date, DailyActivityRead] = {}
    activity_date = start_date
    while activity_date <= end_date:
        daily_activity[activity_date] = DailyActivityRead(
            date=activity_date,
            revenue_htg=0,
            expenses_htg=0,
            sales_count=0,
        )
        activity_date += timedelta(days=1)

    sale_day = _business_date_expression(Sale.sold_at, db)
    sale_activity_rows = db.execute(
        select(
            sale_day.label("activity_date"),
            func.sum(Sale.total_htg).label("revenue_htg"),
            func.count(Sale.id).label("sales_count"),
        )
        .where(*period_sales)
        .group_by(sale_day)
    )
    for row in sale_activity_rows:
        activity_day = _as_date(row.activity_date)
        if activity_day in daily_activity:
            current = daily_activity[activity_day]
            daily_activity[activity_day] = DailyActivityRead(
                date=activity_day,
                revenue_htg=int(row.revenue_htg or 0),
                expenses_htg=current.expenses_htg,
                sales_count=int(row.sales_count or 0),
            )

    expense_day = _business_date_expression(Expense.spent_at, db)
    expense_activity_rows = db.execute(
        select(
            expense_day.label("activity_date"),
            func.sum(Expense.amount_htg).label("expenses_htg"),
        )
        .where(*period_expenses)
        .group_by(expense_day)
    )
    for row in expense_activity_rows:
        activity_day = _as_date(row.activity_date)
        if activity_day in daily_activity:
            current = daily_activity[activity_day]
            daily_activity[activity_day] = DailyActivityRead(
                date=activity_day,
                revenue_htg=current.revenue_htg,
                expenses_htg=int(row.expenses_htg or 0),
                sales_count=current.sales_count,
            )

    top_rows = db.execute(
        select(
            Product.id,
            Product.name,
            func.sum(Sale.quantity).label("quantity"),
            func.sum(Sale.total_htg).label("revenue_htg"),
        )
        .join(
            Sale,
            (Sale.product_id == Product.id)
            & (Sale.business_id == Product.business_id),
        )
        .where(
            Product.business_id == business_id,
            *period_sales,
        )
        .group_by(Product.id, Product.name)
        .order_by(func.sum(Sale.quantity).desc(), Product.name)
        .limit(5)
    )
    top_products = [
        TopProductRead(
            product_id=row.id,
            name=row.name,
            quantity=row.quantity,
            revenue_htg=row.revenue_htg,
        )
        for row in top_rows
    ]

    low_stock_rows = db.scalars(
        select(Product)
        .where(
            Product.business_id == business_id,
            Product.is_active.is_(True),
            Product.stock_quantity <= Product.min_stock_quantity,
        )
        .order_by(Product.stock_quantity, Product.name)
        .limit(20)
    )
    low_stock_count = db.scalar(
        select(func.count(Product.id)).where(
            Product.business_id == business_id,
            Product.is_active.is_(True),
            Product.stock_quantity <= Product.min_stock_quantity,
        )
    )
    low_stock_products = [
        ProductRead.model_validate(product) for product in low_stock_rows
    ]

    return DashboardSummary(
        period=period,
        start_date=start_date,
        end_date=end_date,
        revenue_htg=revenue_htg or 0,
        expenses_total_htg=expenses_total_htg or 0,
        sales_count=sales_count or 0,
        low_stock_count=low_stock_count or 0,
        daily_activity=list(daily_activity.values()),
        top_products=top_products,
        low_stock_products=low_stock_products,
    )
