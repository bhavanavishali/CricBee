from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.notification import NotificationListResponse
from app.models.notification import Notification, RecipientType
from app.services.fans.notification_service import (
    get_fan_notifications,
    mark_fan_notification_as_read
)
from sqlalchemy import desc

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=NotificationListResponse)
def get_user_notifications(
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    
    
    if current_user.role == UserRole.CLUB_MANAGER:
        notifications = db.query(Notification).filter(
            Notification.recipient_type == RecipientType.CLUB_MANAGER,
            Notification.recipient_id == current_user.id
        ).order_by(desc(Notification.created_at)).all()
        unread_count = len([n for n in notifications if not n.is_read])
        
        return NotificationListResponse(
            notifications=notifications,
            unread_count=unread_count
        )
    elif current_user.role == UserRole.FAN:
        result = get_fan_notifications(db, current_user)
        return NotificationListResponse(
            notifications=result["notifications"],
            unread_count=result["unread_count"]
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Notifications not available for this role"
        )

@router.post("/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    
    # Use fan service for fan users
    if current_user.role == UserRole.FAN:
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
    
    # Handle other roles (club manager, etc.)
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    
    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}