from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import (
    Tournament, TournamentDetails, TournamentPayment, TournamentEnrollment,
    TournamentStatus, PaymentStatus
)
from app.models.club import Club
from app.models.user import User, UserRole
from app.models.admin.transaction import Transaction, TransactionType, TransactionStatus, TransactionDirection
from app.services.admin.transaction_service import generate_transaction_id, create_transaction
from app.services.organizer.payment_service import create_razorpay_order, verify_payment_signature
from app.schemas.organizer.tournament import TournamentResponse
from app.schemas.clubmanager.enrollment import TournamentEnrollmentResponse
from app.core.config import settings
from decimal import Decimal
from datetime import date, datetime
from typing import List, Optional, Dict, Any

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

def get_club_manager_wallet_balance(db: Session, club_manager_id: int) -> Decimal:
    #Calculate club manager wallet balance from transactions"
    transactions = db.query(Transaction).filter(
        Transaction.club_manager_id == club_manager_id,
        Transaction.status.in_([TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value])
    ).all()
    
    balance = Decimal('0.00')
    for transaction in transactions:
        if transaction.transaction_direction == TransactionDirection.CREDIT.value:
            balance += transaction.amount
        elif transaction.transaction_direction == TransactionDirection.DEBIT.value:
            balance -= transaction.amount
    
    return balance

def initiate_enrollment(
    db: Session,
    tournament_id: int,
    club_id: int,
    club_manager_id: int
) -> dict:
    #Initiate tournament enrollment and create Razorpay order for payment
    
    # Verify tournament exists and is eligible
    tournament = (
        db.query(Tournament)
        .options(joinedload(Tournament.details))
        .filter(Tournament.id == tournament_id)
        .first()
    )
    
    if not tournament:
        raise ValueError("Tournament not found")
    
    if not tournament.details:
        raise ValueError("Tournament details not found")
    

    if tournament.status != TournamentStatus.REGISTRATION_OPEN.value:
        raise ValueError("Tournament is not open for registration")
    
  
    today = date.today()
    if today > tournament.details.registration_end_date:
        raise ValueError("Registration period has ended")
    
    if today < tournament.details.registration_start_date:
        raise ValueError("Registration has not started yet")
    
    # Verify club exists and belongs to the club manager
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == club_manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
    # Check if already enrolled
    existing_enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.club_id == club_id
    ).first()
    
    if existing_enrollment:
        raise ValueError("Club is already enrolled in this tournament")
    
    # Get enrollment fee from tournament details
    enrollment_fee = tournament.details.enrollment_fee

    if enrollment_fee is None:
        raise ValueError("Enrollment fee is not set for this tournament")
    
    if enrollment_fee < 0:
        raise ValueError("Enrollment fee cannot be negative")
    
    # Convert to Decimal if needed
    enrollment_fee = Decimal(str(enrollment_fee))
    
    # Minimum enrollment fee is 1 rupee (Razorpay requirement)
    if enrollment_fee < Decimal('1.00'):
        raise ValueError("Enrollment fee must be at least ₹1.00")
    
    
    try:
        receipt = f"ENR_{tournament_id}_{club_id}_{int(datetime.now().timestamp())}"
        razorpay_order = create_razorpay_order(
            amount=enrollment_fee,  # Payment amount = enrollment fee
            receipt=receipt,
            currency="INR"
        )
        
        # Create pending enrollment record (status will be SUCCESS only after payment verification)
        enrollment = TournamentEnrollment(
            tournament_id=tournament_id,
            club_id=club_id,
            enrolled_by=club_manager_id,
            enrolled_fee=enrollment_fee,
            payment_status=PaymentStatus.PENDING.value
        )
        db.add(enrollment)
        db.flush()
        db.refresh(enrollment)
        
        return {
            "enrollment": TournamentEnrollmentResponse.model_validate(enrollment),
            "razorpay_order": {
                "order_id": razorpay_order["id"],
                "amount": float(enrollment_fee),
                "currency": "INR",
                "key": settings.razorpay_key_id
            }
        }
    except Exception as e:
        raise ValueError(f"Failed to create payment order: {str(e)}")

def verify_and_complete_enrollment(
    db: Session,
    tournament_id: int,
    club_id: int,
    club_manager_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> TournamentEnrollment:
    #Verify payment and complete enrollment
    
    
    tournament = (
        db.query(Tournament)
        .options(joinedload(Tournament.details))
        .filter(Tournament.id == tournament_id)
        .first()
    )
    
    if not tournament or not tournament.details:
        raise ValueError("Tournament not found")
    
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == club_manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
  
    enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.club_id == club_id,
        TournamentEnrollment.enrolled_by == club_manager_id
    ).first()
    
    if not enrollment:
        raise ValueError("Enrollment record not found")
    
    if enrollment.payment_status == PaymentStatus.SUCCESS.value:
        raise ValueError("Enrollment already completed")
    
    # Verify payment signature - enrollment only completes after successful payment
    if not verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise ValueError("Invalid payment signature")
    
    # Get enrollment fee amount (this is the amount that was paid)
    enrollment_fee = enrollment.enrolled_fee
    
    # Create DEBIT transaction for club manager (enrollment fee debited from club manager's wallet)
    club_manager_transaction_id = generate_transaction_id()
    club_manager_transaction = create_transaction(
        db=db,
        club_manager_id=club_manager_id,
        transaction_type=TransactionType.ENROLLMENT_FEE.value,  # Transaction Type: Enrollment Fee
        transaction_direction=TransactionDirection.DEBIT.value,  # Debit from club manager
        amount=enrollment_fee,
        status=TransactionStatus.SUCCESS.value,  # Transaction Status: Success
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=f"Tournament enrollment fee for {tournament.tournament_name}",
        transaction_id=club_manager_transaction_id
    )
    
    
    organizer_transaction_id = generate_transaction_id()
    organizer_transaction = create_transaction(
        db=db,
        organizer_id=tournament.organizer_id,
        transaction_type=TransactionType.ENROLLMENT_FEE.value,  # Transaction Type: Enrollment Fee
        transaction_direction=TransactionDirection.CREDIT.value,  # Transaction Direction: Credit
        amount=enrollment_fee,
        status=TransactionStatus.SUCCESS.value,  # Transaction Status: Success
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=f"Tournament enrollment fee from club {club.club_name}",
        transaction_id=organizer_transaction_id
    )
    
    # Update enrollment status
    enrollment.payment_status = PaymentStatus.SUCCESS.value
    enrollment.updated_at = datetime.now()
    
    db.flush()
    db.refresh(enrollment)
    return TournamentEnrollmentResponse.model_validate(enrollment)

def get_enrolled_clubs_for_tournament(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> List[dict]:
    """Get all clubs enrolled in a tournament (for organizer)"""
    
    # Verify tournament exists and belongs to organizer
    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Get all enrollments for this tournament
    enrollments = (
        db.query(TournamentEnrollment)
        .join(Club, TournamentEnrollment.club_id == Club.id)
        .join(User, TournamentEnrollment.enrolled_by == User.id)
        .filter(TournamentEnrollment.tournament_id == tournament_id)
        .order_by(TournamentEnrollment.created_at.desc())
        .all()
    )
    
    result = []
    for enrollment in enrollments:
        result.append({
            "id": enrollment.id,
            "tournament_id": enrollment.tournament_id,
            "club_id": enrollment.club_id,
            "club_name": enrollment.club.club_name,
            "enrolled_by": enrollment.enrolled_by,
            "enrolled_by_name": enrollment.enrolled_by_user.full_name,
            "enrolled_by_email": enrollment.enrolled_by_user.email,
            "enrolled_fee": enrollment.enrolled_fee,
            "payment_status": enrollment.payment_status,
            "created_at": enrollment.created_at
        })
    
    return result
