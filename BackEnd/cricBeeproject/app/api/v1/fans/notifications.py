"""Fan API endpoints for notifications - authentication required"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.notification import NotificationListResponse
from app.services.fans.notification_service import (
    get_fan_notifications,
    mark_fan_notification_as_read
)

router = APIRouter(prefix="/notifications", tags=["fans-notifications"])


@router.get("/", response_model=NotificationListResponse)
def get_fan_notifications_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all notifications for the authenticated fan user"""
    current_user = get_current_user(request, db)
    
    # Ensure user is a fan
    if current_user.role != UserRole.FAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for fan users"
        )
    
    result = get_fan_notifications(db, current_user)
    return NotificationListResponse(
        notifications=result["notifications"],
        unread_count=result["unread_count"]
    )


@router.post("/{notification_id}/mark-read")
def mark_fan_notification_read(
    notification_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Mark a fan notification as read"""
    current_user = get_current_user(request, db)
    
    # Ensure user is a fan
    if current_user.role != UserRole.FAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for fan users"
        )
    
    try:
        mark_fan_notification_as_read(db, notification_id, current_user)
        return {"message": "Notification marked as read"}
    except ValueError as e:
        if str(e) == "Notification not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )

