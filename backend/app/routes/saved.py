"""
routes/saved.py — Save and retrieve saved mappings.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.mapping import Mapping
from app.models.saved_item import SavedItem
from app.models.user import User

router = APIRouter(tags=["saved"])


class SaveRequest(BaseModel):
    mapping_id: int


class SavedMappingResponse(BaseModel):
    id: int
    mapping_id: int
    old_code: str
    old_section: str
    new_code: str
    new_section: str
    title: str
    notes: str


@router.post("/save", status_code=status.HTTP_201_CREATED)
def save_mapping(
    payload: SaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mapping = db.query(Mapping).filter(Mapping.id == payload.mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found.")

    # Check for duplicates
    existing = (
        db.query(SavedItem)
        .filter(
            SavedItem.user_id == current_user.id,
            SavedItem.mapping_id == payload.mapping_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Mapping already saved."
        )

    item = SavedItem(user_id=current_user.id, mapping_id=payload.mapping_id)
    db.add(item)
    db.commit()
    return {"detail": "Mapping saved successfully."}


@router.delete("/save/{mapping_id}", status_code=status.HTTP_200_OK)
def unsave_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(SavedItem)
        .filter(
            SavedItem.user_id == current_user.id,
            SavedItem.mapping_id == mapping_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved item not found.")
    db.delete(item)
    db.commit()
    return {"detail": "Mapping removed from saved."}


@router.get("/saved", response_model=List[SavedMappingResponse])
def get_saved(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(SavedItem)
        .filter(SavedItem.user_id == current_user.id)
        .all()
    )
    return [
        SavedMappingResponse(
            id=item.id,
            mapping_id=item.mapping_id,
            old_code=item.mapping.old_code,
            old_section=item.mapping.old_section,
            new_code=item.mapping.new_code,
            new_section=item.mapping.new_section,
            title=item.mapping.title,
            notes=item.mapping.notes,
        )
        for item in items
    ]
