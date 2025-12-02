from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentStatus, PaymentStatus
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.schemas.organizer.tournament import TournamentCreate, TournamentResponse
from app.services.organizer.payment_service import create_razorpay_order, verify_payment_signature
from app.core.config import settings
from decimal import Decimal
from datetime import datetime, date
from typing import List

LEGACY_STATUS_MAP = {
    "payment_completed": TournamentStatus.REGISTRATION_OPEN.value,
    "active": TournamentStatus.TOURNAMENT_START.value,
    "completed": TournamentStatus.TOURNAMENT_END.value,
}


def _sync_tournament_status(db: Session, tournament: Tournament) -> bool:
    """Ensure tournament.status reflects current timeline."""
    changed = False

    if tournament.status in LEGACY_STATUS_MAP:
        tournament.status = LEGACY_STATUS_MAP[tournament.status]
        changed = True

    if tournament.status == TournamentStatus.PENDING_PAYMENT.value or not tournament.details:
        if changed:
            db.add(tournament)
        return changed

    today = date.today()
    details = tournament.details
    reg_start = details.registration_start_date
    reg_end = details.registration_end_date
    start_date = details.start_date
    end_date = details.end_date

    new_status = tournament.status

    if reg_end and today <= reg_end:
        # Before or during registration window
        if not reg_start or today < reg_start:
            new_status = TournamentStatus.REGISTRATION_OPEN.value
        elif reg_start <= today <= reg_end:
            new_status = TournamentStatus.REGISTRATION_OPEN.value
    elif reg_end and today > reg_end and start_date and today < start_date:
        new_status = TournamentStatus.REGISTRATION_END.value
    elif start_date and end_date and start_date <= today <= end_date:
        new_status = TournamentStatus.TOURNAMENT_START.value
    elif end_date and today > end_date:
        new_status = TournamentStatus.TOURNAMENT_END.value
    else:
        new_status = TournamentStatus.REGISTRATION_OPEN.value

    if new_status != tournament.status:
        tournament.status = new_status
        db.add(tournament)
        changed = True

    return changed

def create_tournament_with_payment(
    db: Session,
    tournament_data: TournamentCreate,
    organizer_id: int
) -> dict:
    """Create tournament and initiate payment"""
    
    # Verify plan exists and is active
    plan = db.query(TournamentPricingPlan).filter(
        TournamentPricingPlan.id == tournament_data.plan_id,
        TournamentPricingPlan.status == "active"
    ).first()
    
    if not plan:
        raise ValueError("Invalid or inactive pricing plan")
    
    # Create tournament
    tournament = Tournament(
        tournament_name=tournament_data.tournament_name,
        organizer_id=organizer_id,
        plan_id=tournament_data.plan_id,
        status=TournamentStatus.PENDING_PAYMENT.value
    )
    db.add(tournament)
    db.flush()  # Get tournament ID without committing
    
    # Create tournament details
    details = TournamentDetails(
        tournament_id=tournament.id,
        overs=tournament_data.details.overs,
        start_date=tournament_data.details.start_date,
        end_date=tournament_data.details.end_date,
        registration_start_date=tournament_data.details.registration_start_date,
        registration_end_date=tournament_data.details.registration_end_date,
        location=tournament_data.details.location,
        venue_details=tournament_data.details.venue_details,
        team_range=tournament_data.details.team_range,
        is_public=tournament_data.details.is_public
    )
    db.add(details)
    
    # Create payment record
    payment = TournamentPayment(
        tournament_id=tournament.id,
        amount=plan.amount,
        payment_status=PaymentStatus.PENDING.value
    )
    db.add(payment)
    db.flush()
    
    # Create Razorpay order
    razorpay_order = create_razorpay_order(
        amount=plan.amount,
        receipt=f"tournament_{tournament.id}"
    )
    
    # Update payment with order ID
    payment.razorpay_order_id = razorpay_order["id"]
    db.commit()
    
    # Refresh tournament with relationships
    db.refresh(tournament)
    db.refresh(details)
    db.refresh(payment)
    
    return {
        "tournament": TournamentResponse.model_validate(tournament),
        "razorpay_order": {
            "order_id": razorpay_order["id"],
            "amount": float(plan.amount),
            "currency": "INR",
            "key": settings.razorpay_key_id
        }
    }

def verify_and_complete_payment(
    db: Session,
    tournament_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> TournamentResponse:
    """Verify payment and activate tournament"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise ValueError("Tournament not found")
    
    payment = db.query(TournamentPayment).filter(
        TournamentPayment.tournament_id == tournament_id
    ).first()
    
    if not payment:
        raise ValueError("Payment record not found")
    
    # Verify signature
    if not verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise ValueError("Invalid payment signature")
    
    # Update payment
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.payment_status = PaymentStatus.SUCCESS.value
    payment.payment_date = datetime.now()
    
    # Activate tournament and move to registration flow
    tournament.status = TournamentStatus.REGISTRATION_OPEN.value
    _sync_tournament_status(db, tournament)
    
    db.commit()
    db.refresh(tournament)
    
    return TournamentResponse.model_validate(tournament)

def get_organizer_tournaments(db: Session, organizer_id: int) -> List[TournamentResponse]:
    """Get all tournaments for an organizer"""
    tournaments = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment),
        joinedload(Tournament.plan)
    ).filter(
        Tournament.organizer_id == organizer_id
    ).order_by(Tournament.created_at.desc()).all()
    
    changed = False
    for tournament in tournaments:
        if _sync_tournament_status(db, tournament):
            changed = True
    if changed:
        db.commit()
        for tournament in tournaments:
            db.refresh(tournament)
    
    return [TournamentResponse.model_validate(tournament) for tournament in tournaments]