from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

PeriodKey = Literal["7days", "month", "30days"]


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    purchase_cost_htg: int | None = Field(default=None, gt=0)
    unit_price_htg: int = Field(gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    min_stock_quantity: int = Field(default=0, ge=0)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Non pwodwi a obligatwa.")
        return value


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    purchase_cost_htg: int | None
    unit_price_htg: int
    stock_quantity: int
    min_stock_quantity: int
    is_active: bool
    created_at: datetime


class SaleCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    payment_method: str | None = Field(default=None, max_length=40)

    @field_validator("payment_method")
    @classmethod
    def normalize_payment_method(cls, value: str | None) -> str | None:
        return value.strip() if value and value.strip() else None


class SaleRead(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    sold_at: datetime
    quantity: int
    unit_price_htg: int
    total_htg: int
    payment_method: str | None


class ExpenseCreate(BaseModel):
    amount_htg: int = Field(gt=0)
    category: str = Field(min_length=1, max_length=80)
    spent_at: date
    description: str | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Kategori depans lan obligatwa.")
        return value


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount_htg: int
    category: str
    spent_at: datetime
    description: str | None
    created_at: datetime


class TopProductRead(BaseModel):
    product_id: UUID
    name: str
    quantity: int
    revenue_htg: int


class DailyActivityRead(BaseModel):
    date: date
    revenue_htg: int
    expenses_htg: int
    sales_count: int


class DashboardSummary(BaseModel):
    period: PeriodKey
    start_date: date
    end_date: date
    revenue_htg: int
    expenses_total_htg: int
    sales_count: int
    low_stock_count: int
    daily_activity: list[DailyActivityRead]
    top_products: list[TopProductRead]
    low_stock_products: list[ProductRead]
