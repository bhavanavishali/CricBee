
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.notification import Notification, RecipientType
from app.models.user import User, UserRole
from typing import List, Dict, Any, Optional


def get_fan_notifications(db: Session, fan_user: User) -> Dict[str, Any]:
    
    notifications = db.query(Notification).filter(
        Notification.recipient_type == RecipientType.FAN,
        Notification.recipient_id == fan_user.id
    ).order_by(desc(Notification.created_at)).all()
    
    unread_count = len([n for n in notifications if not n.is_read])
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


def mark_fan_notification_as_read(
    db: Session,
    notification_id: int,
    fan_user: User
) -> None:
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        raise ValueError("Notification not found")
    
    if notification.recipient_id != fan_user.id:
        raise ValueError("Access denied")
    
    notification.is_read = True
    db.commit()


def create_notification_for_all_fans(
    db: Session,
    title: str,
    description: str,
    tournament_id: Optional[int] = None
) -> int:
   
    fans = db.query(User).filter(User.role == UserRole.FAN).all()
    
    count = 0
    for fan in fans:
        notification = Notification(
            title=title,
            description=description,
            recipient_type=RecipientType.FAN,
            recipient_id=fan.id,
            tournament_id=tournament_id
        )
        db.add(notification)
        count += 1
    
    db.commit()
    return count


def create_notification_for_fan(
    db: Session,
    fan_id: int,
    title: str,
    description: str,
    tournament_id: Optional[int] = None
) -> Notification:
    
    notification = Notification(
        title=title,
        description=description,
        recipient_type=RecipientType.FAN,
        recipient_id=fan_id,
        tournament_id=tournament_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

