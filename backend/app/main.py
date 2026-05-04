"""
Legal Mapper — FastAPI Application Entry Point
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routes import auth, explain, history, payments, saved, search, users
from app.services.seed_service import seed_mappings

# ---------------------------------------------------------------------------
# Create all tables (idempotent — does nothing if tables already exist)
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# Seed initial data
# ---------------------------------------------------------------------------
with SessionLocal() as _db:
    seeded = seed_mappings(_db)
    if seeded:
        print(f"[Legal Mapper] Seeded {seeded} mappings from mapping.json")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(
    title="Legal Mapper API",
    description=(
        "Maps Indian Penal Code (IPC) sections to Bharatiya Nyaya Sanhita (BNS) sections. "
        "Provides authentication, rate-limiting, saved items, search history, "
        "AI-powered explanations, and Razorpay payment integration."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(saved.router)
app.include_router(history.router)
app.include_router(explain.router)
app.include_router(payments.router)
app.include_router(users.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Legal Mapper API v2 is running."}
