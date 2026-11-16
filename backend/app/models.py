from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)


class BusinessMember(Base):
    __tablename__ = "business_members"

    business_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="owner")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("business_id", "id"),
        CheckConstraint("length(trim(name)) > 0"),
        CheckConstraint("purchase_cost_htg IS NULL OR purchase_cost_htg > 0"),
        CheckConstraint("unit_price_htg > 0"),
        CheckConstraint("stock_quantity >= 0"),
        CheckConstraint("min_stock_quantity >= 0"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    business_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    purchase_cost_htg: Mapped[int | None] = mapped_column(BigInteger)
    unit_price_htg: Mapped[int] = mapped_column(BigInteger, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    min_stock_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        ForeignKeyConstraint(
            ["business_id", "product_id"],
            ["products.business_id", "products.id"],
            ondelete="RESTRICT",
        ),
        CheckConstraint("quantity > 0"),
        CheckConstraint("unit_price_htg > 0"),
        CheckConstraint("total_htg > 0"),
        CheckConstraint("total_htg = quantity * unit_price_htg"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    business_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    sold_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_htg: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_htg: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("amount_htg > 0"),
        CheckConstraint("length(trim(category)) > 0"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    business_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    amount_htg: Mapped[int] = mapped_column(BigInteger, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    spent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
