"""
models/saved_item.py — SQLAlchemy SavedItem model.
"""

from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mapping_id = Column(Integer, ForeignKey("mappings.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", backref="saved_items")
    mapping = relationship("Mapping")

    __table_args__ = (
        UniqueConstraint("user_id", "mapping_id", name="uq_user_mapping"),
    )
