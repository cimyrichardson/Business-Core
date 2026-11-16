from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth import get_current_user_id
from app.database import get_database_session
from app.main import api as app
from app.models import Base, Business, BusinessMember, Product

TEST_USER_ID = UUID("f0ab12e3-1d3f-4f06-9000-36ec38b6ab10")


@pytest.fixture
def api_client() -> Iterator[tuple[TestClient, Session, UUID]]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TRIGGER sales_decrement_stock
                AFTER INSERT ON sales
                BEGIN
                    UPDATE products
                    SET stock_quantity = stock_quantity - NEW.quantity
                    WHERE id = NEW.product_id
                      AND business_id = NEW.business_id
                      AND stock_quantity >= NEW.quantity;
                END;
                """
            )
        )

    business_id = uuid4()
    with Session(engine) as seed_session:
        seed_session.add(
            Business(
                id=business_id,
                name="Boutik tès",
            )
        )
        seed_session.add(
            BusinessMember(
                business_id=business_id,
                user_id=TEST_USER_ID,
                role="owner",
            )
        )
        seed_session.add(
            Product(
                business_id=business_id,
                name="Diri 1 kg",
                unit_price_htg=250,
                stock_quantity=6,
                min_stock_quantity=2,
            )
        )
        seed_session.commit()

    def override_database() -> Iterator[Session]:
        with Session(engine, expire_on_commit=False) as session:
            yield session

    app.dependency_overrides[get_database_session] = override_database
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID

    with TestClient(app) as client:
        with Session(engine, expire_on_commit=False) as read_session:
            yield client, read_session, business_id

    app.dependency_overrides.clear()
    engine.dispose()
