"""
routes/explain.py — AI-powered explanation endpoint (Pro plan only).
Requires OPENAI_API_KEY env var.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import require_pro
from app.database import get_db
from app.models.mapping import Mapping
from app.models.user import User

router = APIRouter(tags=["explain"])

DISCLAIMER = "This is AI-generated and not legal advice."
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class ExplainResponse(BaseModel):
    explanation: str
    key_changes: str
    disclaimer: str


@router.get("/mappings/{mapping_id}/explain", response_model=ExplainResponse)
def explain_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    mapping = db.query(Mapping).filter(Mapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mapping not found.")

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please set OPENAI_API_KEY.",
        )

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        prompt = (
            f"Explain the difference between IPC Section {mapping.old_section} and "
            f"BNS Section {mapping.new_section} ({mapping.title}) in simple terms. "
            "Provide: 1) A brief plain-English explanation, 2) Key changes between IPC and BNS. "
            "Format your response as JSON with keys 'explanation' and 'key_changes'."
        )
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500,
        )
        import json

        content = response.choices[0].message.content.strip()
        # Try to parse JSON; fall back to raw text
        try:
            data = json.loads(content)
            explanation = data.get("explanation", content)
            key_changes = data.get("key_changes", "")
        except json.JSONDecodeError:
            explanation = content
            key_changes = ""

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {exc}",
        ) from exc

    return ExplainResponse(
        explanation=explanation,
        key_changes=key_changes,
        disclaimer=DISCLAIMER,
    )
