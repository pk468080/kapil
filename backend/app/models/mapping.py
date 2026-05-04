"""
models/mapping.py — SQLAlchemy Mapping model.
"""

from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Mapping(Base):
    __tablename__ = "mappings"

    id = Column(Integer, primary_key=True, index=True)
    old_section = Column(String, index=True, nullable=False)
    new_section = Column(String, index=True, nullable=False)
    old_code = Column(String, default="IPC", nullable=False)
    new_code = Column(String, default="BNS", nullable=False)
    title = Column(String, nullable=False)
    notes = Column(Text, default="")
