from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user_id
from app.database import get_database_session
from app.models import BusinessMember


def get_business_id(
    db: Session = Depends(get_database_session),
    user_id: UUID = Depends(get_current_user_id),
) -> UUID:
    business_id = db.scalar(
        select(BusinessMember.business_id)
        .where(BusinessMember.user_id == user_id)
        .order_by(BusinessMember.created_at, BusinessMember.business_id)
        .limit(1)
    )
    if business_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kont sa a poko asosye ak yon biznis.",
        )
    return business_id
