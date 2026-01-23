from celery import Celery
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.notification import Notification, RecipientType
from app.models.organizer.tournament import TournamentEnrollment
from app.models.user import User, UserRole

celery_app = Celery('cricbee')

@celery_app.task
def send_tournament_cancellation_notification(tournament_id: int, title: str, description: str):
   
    db = next(get_db())
    
    try:
       
        enrolled_clubs = db.query(TournamentEnrollment).filter(
            TournamentEnrollment.tournament_id == tournament_id
        ).all()
        
       
        for enrollment in enrolled_clubs:
            notification = Notification(
                title=title,
                description=description,
                recipient_type=RecipientType.CLUB_MANAGER,
                recipient_id=enrollment.enrolled_by,
                tournament_id=tournament_id
            )
            db.add(notification)
        
        # Send notifications to all fans
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