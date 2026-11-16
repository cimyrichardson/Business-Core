from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import dashboard, expenses, health, products, sales

settings = get_settings()

api = FastAPI(
    title="Business Core API",
    description="API métier pour les boutiques Business Core.",
    version="0.1.0",
)

api.include_router(health.router)
api.include_router(dashboard.router, prefix="/api/v1")
api.include_router(products.router, prefix="/api/v1")
api.include_router(sales.router, prefix="/api/v1")
api.include_router(expenses.router, prefix="/api/v1")

app = CORSMiddleware(
    app=api,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
