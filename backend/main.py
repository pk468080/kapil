"""
Legal Mapper — FastAPI backend
Maps IPC sections to BNS sections and supports reverse lookup.
"""

import json
import re
from pathlib import Path
from typing import List

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

DATA_FILE = Path(__file__).parent / "mapping.json"


def load_mappings() -> List[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


mappings: List[dict] = load_mappings()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Legal Mapper API",
    description="Maps Indian Penal Code (IPC) sections to Bharatiya Nyaya Sanhita (BNS) sections.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class MappingResult(BaseModel):
    old_code: str
    old_section: str
    new_code: str
    new_section: str
    title: str
    notes: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STRIP_WORDS = re.compile(r"\b(ipc|bns|section|sec|law|the|of|and|in|to)\b", re.IGNORECASE)
_WHITESPACE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Lowercase, remove common legal prefixes/filler words, collapse whitespace."""
    text = text.lower()
    text = _STRIP_WORDS.sub(" ", text)
    text = _WHITESPACE.sub(" ", text).strip()
    return text


def matches(entry: dict, raw_query: str) -> bool:
    """Return True if *entry* matches the (raw) user query."""
    q = normalize(raw_query)

    # 1. Exact section match against old_section or new_section
    if q == entry["old_section"] or q == entry["new_section"]:
        return True

    # 2. Section number contained anywhere in the normalised query
    if entry["old_section"] in q or entry["new_section"] in q:
        return True

    # 3. Keyword match against normalised title
    normalised_title = normalize(entry["title"])
    if q and q in normalised_title:
        return True

    # 4. Any individual query token found in title
    tokens = [t for t in q.split() if len(t) > 1]
    if tokens and all(tok in normalised_title for tok in tokens):
        return True

    return False


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/", summary="Health check")
def health_check():
    return {"status": "ok", "message": "Legal Mapper API is running."}


@app.get("/search", response_model=List[MappingResult], summary="Search IPC ↔ BNS mappings")
def search(query: str = Query(..., min_length=1, description="Search term, e.g. '420', 'IPC 420', 'cheating'")):
    results = [entry for entry in mappings if matches(entry, query)]
    return results
