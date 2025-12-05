from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentStatus, PaymentStatus
from app.schemas.organizer.tournament import TournamentResponse
from datetime import date
from typing import List

def get_eligible_tournaments_for_club_manager(db: Session) -> List[TournamentResponse]:

    today = date.today()
    
    tournaments = (
        db.query(Tournament)
        .options(
            joinedload(Tournament.details),
            joinedload(Tournament.payment),
            joinedload(Tournament.plan)
        )
        .join(TournamentDetails, Tournament.id == TournamentDetails.tournament_id)
        .join(TournamentPayment, Tournament.id == TournamentPayment.tournament_id)
        .filter(
            TournamentDetails.is_public == True,
            TournamentDetails.registration_end_date > today,
            TournamentPayment.payment_status == PaymentStatus.SUCCESS.value,
            Tournament.status != TournamentStatus.CANCELLED.value
        )
        .order_by(TournamentDetails.registration_end_date.asc())
        .all()
    )
    
    return [TournamentResponse.model_validate(tournament) for tournament in tournaments]
