from celery import Celery
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.notification import Notification, RecipientType
from app.models.user import User, UserRole
from typing import List

celery_app = Celery('cricbee')

@celery_app.task
def send_tournament_cancellation_notification(
    tournament_id: int, 
    title: str, 
    description: str,
    enrolled_club_manager_ids: List[int] = None
):
    
    db = next(get_db())
    
    try:
        
        if enrolled_club_manager_ids:
            for club_manager_id in enrolled_club_manager_ids:
                notification = Notification(
                    title=title,
                    description=description,
                    recipient_type=RecipientType.CLUB_MANAGER,
                    recipient_id=club_manager_id,
                    tournament_id=tournament_id
                )
                db.add(notification)
        
      
        fans = db.query(User).filter(User.role == UserRole.FAN).all()
        for fan in fans:
            notification = Notification(
                title=title,
                description=description,
                recipient_type=RecipientType.FAN,
                recipient_id=fan.id,
                tournament_id=tournament_id
            )
            db.add(notification)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()