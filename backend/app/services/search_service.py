"""
services/search_service.py — Query normalisation and ranked search logic.
"""

import re
from typing import List

from sqlalchemy.orm import Session

from app.models.mapping import Mapping

_STRIP_WORDS = re.compile(
    r"\b(ipc|bns|section|sec|law|the|of|and|in|to)\b", re.IGNORECASE
)
_WHITESPACE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Lowercase, strip legal filler words, collapse whitespace."""
    text = text.lower()
    text = _STRIP_WORDS.sub(" ", text)
    text = _WHITESPACE.sub(" ", text).strip()
    return text


def _score(mapping: Mapping, q_norm: str, tokens: List[str]) -> int:
    """Return a relevance score (higher = better). 0 means no match."""
    score = 0

    # Exact section match
    if q_norm == mapping.old_section or q_norm == mapping.new_section:
        score += 100
    # Section contained in query
    elif mapping.old_section in q_norm or mapping.new_section in q_norm:
        score += 80

    norm_title = normalize(mapping.title)

    # Full query found in title
    if q_norm and q_norm in norm_title:
        score += 60
    # All tokens found in title
    elif tokens and all(tok in norm_title for tok in tokens):
        score += 40
    # At least one token found in title
    elif tokens and any(tok in norm_title for tok in tokens):
        score += 20

    return score


def search_mappings(db: Session, raw_query: str) -> List[dict]:
    """Return a ranked list of mapping dicts matching the query."""
    q = normalize(raw_query)
    tokens = [t for t in q.split() if len(t) > 1]

    all_mappings = db.query(Mapping).all()
    scored = []
    for m in all_mappings:
        s = _score(m, q, tokens)
        if s > 0:
            scored.append((s, m))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        {
            "id": m.id,
            "old_code": m.old_code,
            "old_section": m.old_section,
            "new_code": m.new_code,
            "new_section": m.new_section,
            "title": m.title,
            "notes": m.notes,
            "score": s,
        }
        for s, m in scored
    ]
