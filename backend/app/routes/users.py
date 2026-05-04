"""
routes/users.py — User profile endpoint.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(tags=["users"])


class UserProfile(BaseModel):
    id: int
    email: str
    plan: str


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    return UserProfile(id=current_user.id, email=current_user.email, plan=current_user.plan)
