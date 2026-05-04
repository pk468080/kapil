"""
routes/payments.py — Razorpay integration (create order, verify payment).
Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.
"""

import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import PlanEnum, User

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
PRO_PLAN_AMOUNT = int(os.getenv("PRO_PLAN_AMOUNT_PAISE", "49900"))  # ₹499 in paise


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Razorpay order for the Pro plan upgrade."""
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured.",
        )
    if current_user.plan == "pro":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a Pro plan.",
        )

    try:
        import razorpay

        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = client.order.create(
            {
                "amount": PRO_PLAN_AMOUNT,
                "currency": "INR",
                "payment_capture": 1,
                "notes": {"user_id": current_user.id, "plan": "pro"},
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {exc}",
        ) from exc

    return CreateOrderResponse(
        order_id=order["id"],
        amount=PRO_PLAN_AMOUNT,
        currency="INR",
        key_id=RAZORPAY_KEY_ID,
    )


@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify Razorpay payment signature and upgrade user to Pro."""
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service is not configured.",
        )

    # Signature verification
    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature.",
        )

    # Upgrade user plan
    current_user.plan = PlanEnum.pro
    db.commit()
    db.refresh(current_user)

    return {"detail": "Payment verified. Your plan has been upgraded to Pro.", "plan": "pro"}


@router.get("/plans")
def list_plans():
    """Return available plan information (public endpoint)."""
    return {
        "plans": [
            {
                "name": "free",
                "label": "Free",
                "price": 0,
                "currency": "INR",
                "features": [
                    f"Up to {os.getenv('FREE_DAILY_SEARCH_LIMIT', '10')} searches/day",
                    "IPC ↔ BNS mapping search",
                    "Save up to 10 results",
                ],
            },
            {
                "name": "pro",
                "label": "Pro",
                "price": PRO_PLAN_AMOUNT,
                "currency": "INR",
                "features": [
                    "Unlimited searches",
                    "AI-powered explanations",
                    "Unlimited saved results",
                    "Full search history",
                ],
            },
        ]
    }
