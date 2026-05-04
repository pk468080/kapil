"""
services/seed_service.py — One-time import of mapping.json into the DB.
"""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.mapping import Mapping

MAPPING_JSON = Path(__file__).parent.parent.parent / "mapping.json"


def seed_mappings(db: Session) -> int:
    """Import mapping.json into the mappings table if it is empty. Returns count inserted."""
    existing = db.query(Mapping).count()
    if existing > 0:
        return 0  # already seeded

    if not MAPPING_JSON.exists():
        return 0

    with open(MAPPING_JSON, encoding="utf-8") as f:
        data = json.load(f)

    inserted = 0
    for item in data:
        m = Mapping(
            old_code=item.get("old_code", "IPC"),
            old_section=item["old_section"],
            new_code=item.get("new_code", "BNS"),
            new_section=item["new_section"],
            title=item.get("title", ""),
            notes=item.get("notes", ""),
        )
        db.add(m)
        inserted += 1

    db.commit()
    return inserted
