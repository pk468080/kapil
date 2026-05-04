"""
routes/history.py — Search history endpoint.
"""

import datetime
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.search_history import SearchHistory
from app.models.user import User

router = APIRouter(tags=["history"])


class HistoryEntry(BaseModel):
    id: int
    query: str
    timestamp: datetime.datetime


@router.get("/history", response_model=List[HistoryEntry])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.timestamp.desc())
        .limit(100)
        .all()
    )
    return [
        HistoryEntry(id=e.id, query=e.query, timestamp=e.timestamp)
        for e in entries
    ]
