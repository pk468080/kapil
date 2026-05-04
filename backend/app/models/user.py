"""
models/user.py — SQLAlchemy User model.
"""

import enum

from sqlalchemy import Column, Enum, Integer, String

from app.database import Base


class PlanEnum(str, enum.Enum):
    free = "free"
    pro = "pro"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    plan = Column(Enum(PlanEnum), default=PlanEnum.free, nullable=False)
