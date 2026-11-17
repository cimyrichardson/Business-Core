from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_database_session
from app.dependencies import get_business_id
from app.main import api
from app.models import Business, Product
from app.periods import BUSINESS_TIMEZONE


def test_health_does_not_require_database_configuration(api_client):
    client, _, _ = api_client

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_products_are_limited_to_the_signed_in_business(api_client):
    client, session, business_id = api_client
    other_business_id = uuid4()
    session.add(Business(id=other_business_id, name="Lòt boutik"))
    session.add(
        Product(
            business_id=other_business_id,
            name="Pwodwi prive",
            unit_price_htg=900,
            stock_quantity=1,
        )
    )
    session.commit()

    response = client.get("/api/v1/products")

    assert response.status_code == 200
    products = response.json()
    assert [product["name"] for product in products] == ["Diri 1 kg"]
    assert products[0]["id"]
    assert products[0]["unit_price_htg"] == 250
    assert session.query(Product).filter_by(
        business_id=business_id,
    ).count() == 1


def test_sale_uses_server_price_and_updates_stock(api_client):
    client, session, business_id = api_client
    product = session.query(Product).filter_by(business_id=business_id).one()

    response = client.post(
        "/api/v1/sales",
        json={
            "product_id": str(product.id),
            "quantity": 2,
            "payment_method": "cash",
        },
    )

    assert response.status_code == 201
    sale = response.json()
    assert sale["unit_price_htg"] == 250
    assert sale["total_htg"] == 500
    assert sale["product_name"] == "Diri 1 kg"
    session.refresh(product)
    assert product.stock_quantity == 4


def test_sale_rejects_quantity_above_stock(api_client):
    client, session, business_id = api_client
    product = session.query(Product).filter_by(business_id=business_id).one()

    response = client.post(
        "/api/v1/sales",
        json={"product_id": str(product.id), "quantity": 7},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Pa gen ase stòk pou kantite sa a."
    session.refresh(product)
    assert product.stock_quantity == 6


def test_sale_cannot_use_another_business_product(api_client):
    client, session, _ = api_client
    other_business_id = uuid4()
    other_product = Product(
        business_id=other_business_id,
        name="Pwodwi lòt biznis",
        unit_price_htg=900,
        stock_quantity=3,
    )
    session.add(Business(id=other_business_id, name="Lòt boutik"))
    session.add(other_product)
    session.commit()

    response = client.post(
        "/api/v1/sales",
        json={"product_id": str(other_product.id), "quantity": 1},
    )

    assert response.status_code == 404


def test_dashboard_returns_business_totals_and_low_stock(api_client):
    client, session, business_id = api_client
    product = session.query(Product).filter_by(business_id=business_id).one()
    product.stock_quantity = 1
    session.commit()

    sale_response = client.post(
        "/api/v1/sales",
        json={"product_id": str(product.id), "quantity": 1},
    )
    expense_response = client.post(
        "/api/v1/expenses",
        json={
            "amount_htg": 75,
            "category": "Transpò",
            "spent_at": date.today().isoformat(),
        },
    )
    dashboard_response = client.get(
        "/api/v1/dashboard/summary?period=30days",
    )

    assert sale_response.status_code == 201
    assert expense_response.status_code == 201
    assert dashboard_response.status_code == 200
    summary = dashboard_response.json()
    assert summary["revenue_htg"] == 250
    assert summary["expenses_total_htg"] == 75
    assert summary["sales_count"] == 1
    assert summary["low_stock_count"] == 1
    assert summary["top_products"][0]["quantity"] == 1
    assert len(summary["daily_activity"]) == 30

    today_activity = next(
        item
        for item in summary["daily_activity"]
        if item["date"] == date.today().isoformat()
    )
    assert all(
        type(item[field]) is int
        for item in summary["daily_activity"]
        for field in ("revenue_htg", "expenses_htg", "sales_count")
    )
    assert today_activity["revenue_htg"] == 250
    assert today_activity["expenses_htg"] == 75
    assert today_activity["sales_count"] == 1


def test_dashboard_serializes_postgres_daily_aggregates_as_json_integers():
    test_date = datetime.now(BUSINESS_TIMEZONE).date()

    class AggregateSession:
        def __init__(self):
            self.scalar_values = iter(
                [Decimal("250.00"), Decimal("75.00"), 1, 0],
            )
            self.query_rows = iter(
                [
                    [
                        SimpleNamespace(
                            activity_date=test_date,
                            revenue_htg=Decimal("250.00"),
                            sales_count=1,
                        ),
                    ],
                    [
                        SimpleNamespace(
                            activity_date=test_date,
                            expenses_htg=Decimal("75.00"),
                        ),
                    ],
                    [],
                ],
            )

        def get_bind(self):
            return SimpleNamespace(
                dialect=SimpleNamespace(name="postgresql"),
            )

        def scalar(self, statement):
            return next(self.scalar_values)

        def execute(self, statement):
            return iter(next(self.query_rows))

        def scalars(self, statement):
            return iter(())

    database_override = api.dependency_overrides.get(get_database_session)
    business_override = api.dependency_overrides.get(get_business_id)
    api.dependency_overrides[get_database_session] = lambda: AggregateSession()
    api.dependency_overrides[get_business_id] = lambda: uuid4()

    try:
        with TestClient(api) as client:
            response = client.get("/api/v1/dashboard/summary?period=7days")
    finally:
        if database_override is None:
            api.dependency_overrides.pop(get_database_session, None)
        else:
            api.dependency_overrides[get_database_session] = database_override
        if business_override is None:
            api.dependency_overrides.pop(get_business_id, None)
        else:
            api.dependency_overrides[get_business_id] = business_override

    assert response.status_code == 200
    today_activity = next(
        item
        for item in response.json()["daily_activity"]
        if item["date"] == test_date.isoformat()
    )
    assert type(today_activity["expenses_htg"]) is int
    assert today_activity["expenses_htg"] == 75
