from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.dependencies import get_business_id
from app.models import Product, Sale
from app.periods import period_datetimes, period_dates
from app.schemas import PeriodKey, SaleCreate, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


def _sale_response(sale: Sale, product_name: str) -> SaleRead:
    return SaleRead(
        id=sale.id,
        product_id=sale.product_id,
        product_name=product_name,
        sold_at=sale.sold_at,
        quantity=sale.quantity,
        unit_price_htg=sale.unit_price_htg,
        total_htg=sale.total_htg,
        payment_method=sale.payment_method,
    )


@router.get("", response_model=list[SaleRead])
def list_sales(
    period: PeriodKey = Query(default="30days"),
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> list[SaleRead]:
    start_date, end_date = period_dates(period)
    start_at, end_at = period_datetimes(start_date, end_date)
    rows = db.execute(
        select(Sale, Product.name)
        .join(
            Product,
            (Product.id == Sale.product_id)
            & (Product.business_id == Sale.business_id),
        )
        .where(
            Sale.business_id == business_id,
            Sale.sold_at >= start_at,
            Sale.sold_at < end_at,
        )
        .order_by(Sale.sold_at.desc(), Sale.id)
        .limit(limit)
        .offset(offset)
    )
    return [_sale_response(sale, name) for sale, name in rows]


@router.post("", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> SaleRead:
    product = db.scalar(
        select(Product)
        .where(
            Product.id == payload.product_id,
            Product.business_id == business_id,
        )
        .with_for_update()
    )
    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pwodwi sa a pa disponib nan biznis sa a.",
        )
    if payload.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pa gen ase stòk pou kantite sa a.",
        )

    sale = Sale(
        business_id=business_id,
        product_id=product.id,
        quantity=payload.quantity,
        unit_price_htg=product.unit_price_htg,
        total_htg=payload.quantity * product.unit_price_htg,
        payment_method=payload.payment_method,
    )
    db.add(sale)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        if "Insufficient stock" in str(error.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Stòk la chanje. Verifye kantite ki rete a.",
            ) from error
        raise

    db.refresh(sale)
    return _sale_response(sale, product.name)
