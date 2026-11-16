from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.dependencies import get_business_id
from app.models import Expense, Product, Sale
from app.periods import period_datetimes, period_dates
from app.schemas import (
    DashboardSummary,
    PeriodKey,
    ProductRead,
    TopProductRead,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


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
        top_products=top_products,
        low_stock_products=low_stock_products,
    )
