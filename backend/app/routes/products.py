from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.dependencies import get_business_id
from app.models import Product
from app.schemas import ProductCreate, ProductRead

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> list[Product]:
    return list(
        db.scalars(
            select(Product)
            .where(Product.business_id == business_id)
            .order_by(Product.name, Product.id)
            .limit(limit)
            .offset(offset)
        )
    )


@router.get("/low-stock", response_model=list[ProductRead])
def list_low_stock(
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> list[Product]:
    return list(
        db.scalars(
            select(Product)
            .where(
                Product.business_id == business_id,
                Product.is_active.is_(True),
                Product.stock_quantity <= Product.min_stock_quantity,
            )
            .order_by(Product.stock_quantity, Product.name)
        )
    )


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    business_id: UUID = Depends(get_business_id),
    db: Session = Depends(get_database_session),
) -> Product:
    product = Product(
        business_id=business_id,
        **payload.model_dump(),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
