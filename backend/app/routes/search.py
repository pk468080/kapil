"""
routes/search.py — Protected search endpoint with rate-limiting by plan.
"""

import datetime
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.search_history import SearchHistory
from app.models.user import User
from app.services.search_service import search_mappings

router = APIRouter(tags=["search"])

FREE_DAILY_LIMIT = int(os.getenv("FREE_DAILY_SEARCH_LIMIT", "10"))


class MappingResult(BaseModel):
    id: int
    old_code: str
    old_section: str
    new_code: str
    new_section: str
    title: str
    notes: str
    score: int


@router.get("/search", response_model=List[MappingResult])
def search(
    query: str = Query(..., min_length=1, description="Search term e.g. '420', 'IPC 302', 'murder'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Rate limiting for free plan
    if current_user.plan == "free":
        today = datetime.date.today()
        today_start = datetime.datetime.combine(today, datetime.time.min)
        count_today = (
            db.query(SearchHistory)
            .filter(
                SearchHistory.user_id == current_user.id,
                SearchHistory.timestamp >= today_start,
            )
            .count()
        )
        if count_today >= FREE_DAILY_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Free plan limit of {FREE_DAILY_LIMIT} searches/day reached. Upgrade to Pro for unlimited searches.",
            )

    # Log to search history
    entry = SearchHistory(user_id=current_user.id, query=query)
    db.add(entry)
    db.commit()

    results = search_mappings(db, query)
    return results
