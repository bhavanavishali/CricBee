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
from app.schemas.clubmanager.enrollment import TournamentEnrollmentResponse, MyEnrollmentResponse
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
    
    tournament = (
        db.query(Tournament)
        .options(joinedload(Tournament.details))
        .filter(Tournament.id == tournament_id)
        .first()
    )
    
    if not tournament:
        raise ValueError("Tournament not found")
    
    if tournament.is_blocked:
        raise ValueError("This tournament has been blocked by the admin and is not available for enrollment")
    
    if not tournament.details:
        raise ValueError("Tournament details not found")
    

    if tournament.status != TournamentStatus.REGISTRATION_OPEN.value:
        raise ValueError("Tournament is not open for registration")
    
  
    today = date.today()
    if today > tournament.details.registration_end_date:
        raise ValueError("Registration period has ended")
    
    if today < tournament.details.registration_start_date:
        raise ValueError("Registration has not started yet")
    
   
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == club_manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
    
    existing_enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.club_id == club_id
    ).first()
    
    if existing_enrollment:
        raise ValueError("Club is already enrolled in this tournament")
    
    
    enrollment_fee = tournament.details.enrollment_fee

    if enrollment_fee is None:
        raise ValueError("Enrollment fee is not set for this tournament")
    
    if enrollment_fee < 0:
        raise ValueError("Enrollment fee cannot be negative")
    
    
    enrollment_fee = Decimal(str(enrollment_fee))
    
    
    if enrollment_fee < Decimal('1.00'):
        raise ValueError("Enrollment fee must be at least ₹1.00")
    
    
    try:
        receipt = f"ENR_{tournament_id}_{club_id}_{int(datetime.now().timestamp())}"
        razorpay_order = create_razorpay_order(
            amount=enrollment_fee,  
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
    

    if not verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise ValueError("Invalid payment signature")
    
    
    enrollment_fee = enrollment.enrolled_fee
    

    club_manager_transaction_id = generate_transaction_id()
    club_manager_transaction = create_transaction(
        db=db,
        club_manager_id=club_manager_id,
        transaction_type=TransactionType.ENROLLMENT_FEE.value,  
        transaction_direction=TransactionDirection.DEBIT.value,
        amount=enrollment_fee,
        status=TransactionStatus.SUCCESS.value, 
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
        transaction_type=TransactionType.ENROLLMENT_FEE.value,  
        transaction_direction=TransactionDirection.CREDIT.value,  
        amount=enrollment_fee,
        status=TransactionStatus.SUCCESS.value,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=f"Tournament enrollment fee from club {club.club_name}",
        transaction_id=organizer_transaction_id
    )
    

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

def remove_club_from_tournament_with_refund(
    db: Session,
    tournament_id: int,
    club_id: int,
    organizer_id: int
) -> dict:

    tournament = db.query(Tournament).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    

    if tournament.status == TournamentStatus.CANCELLED.value:
        raise ValueError("Cannot remove clubs from a cancelled tournament")
    

    enrollment = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.club_id == club_id
    ).first()
    
    if not enrollment:
        raise ValueError("Club is not enrolled in this tournament")
    
 
    if enrollment.payment_status != PaymentStatus.SUCCESS.value:
        
        db.delete(enrollment)
        db.commit()
        return {
            "message": "Club removed from tournament (no refund needed - payment was not successful)",
            "club_id": club_id,
            "tournament_id": tournament_id
        }
    
    
    club_manager_transaction = db.query(Transaction).filter(
        Transaction.tournament_id == tournament_id,
        Transaction.club_manager_id == enrollment.enrolled_by,
        Transaction.transaction_type == TransactionType.ENROLLMENT_FEE.value,
        Transaction.transaction_direction == TransactionDirection.DEBIT.value,
        Transaction.status == TransactionStatus.SUCCESS.value,
        Transaction.amount == enrollment.enrolled_fee
    ).order_by(Transaction.created_at.desc()).first()
    
    
    if club_manager_transaction and club_manager_transaction.razorpay_payment_id:
        organizer_transaction = db.query(Transaction).filter(
            Transaction.tournament_id == tournament_id,
            Transaction.organizer_id == organizer_id,
            Transaction.transaction_type == TransactionType.ENROLLMENT_FEE.value,
            Transaction.transaction_direction == TransactionDirection.CREDIT.value,
            Transaction.status == TransactionStatus.SUCCESS.value,
            Transaction.amount == enrollment.enrolled_fee,
            Transaction.razorpay_payment_id == club_manager_transaction.razorpay_payment_id
        ).first()
    else:
  
        organizer_transaction = db.query(Transaction).filter(
            Transaction.tournament_id == tournament_id,
            Transaction.organizer_id == organizer_id,
            Transaction.transaction_type == TransactionType.ENROLLMENT_FEE.value,
            Transaction.transaction_direction == TransactionDirection.CREDIT.value,
            Transaction.status == TransactionStatus.SUCCESS.value,
            Transaction.amount == enrollment.enrolled_fee
        ).order_by(Transaction.created_at.desc()).first()
    

    if not club_manager_transaction:
        raise ValueError("Club manager transaction not found for refund")
    if not organizer_transaction:
        raise ValueError("Organizer transaction not found for refund")
    
   
    club_manager_transaction.transaction_direction = TransactionDirection.CREDIT.value
    club_manager_transaction.status = TransactionStatus.REFUNDED.value
    club_manager_transaction.description = f"Refund for club removal from tournament {tournament.tournament_name} - {club_manager_transaction.description or ''}"
    club_manager_transaction.updated_at = datetime.now()
    db.add(club_manager_transaction)
    

    organizer_transaction.transaction_direction = TransactionDirection.DEBIT.value
    organizer_transaction.status = TransactionStatus.REFUNDED.value
    organizer_transaction.description = f"Refund for club removal from tournament {tournament.tournament_name} - {organizer_transaction.description or ''}"
    organizer_transaction.updated_at = datetime.now()
    db.add(organizer_transaction)

    enrollment.payment_status = PaymentStatus.REFUNDED.value
    enrollment.updated_at = datetime.now()
    

    db.delete(enrollment)
    
    db.commit()
    
    return {
        "message": "Club removed from tournament and enrollment fee refunded",
        "club_id": club_id,
        "tournament_id": tournament_id,
        "refunded_amount": float(enrollment.enrolled_fee)
    }

def get_club_manager_enrollments(db: Session, club_manager_id: int) -> List[MyEnrollmentResponse]:
    """
    Get all tournament enrollments for a club manager with tournament details
    """
    # Get the club for this manager
    club = db.query(Club).filter(Club.manager_id == club_manager_id).first()
    
    if not club:
        raise ValueError("Club not found for this manager")
    
    # Get all enrollments for this club with tournament details
    enrollments = (
        db.query(TournamentEnrollment)
        .options(
            joinedload(TournamentEnrollment.tournament).joinedload(Tournament.details),
            joinedload(TournamentEnrollment.tournament).joinedload(Tournament.payment),
            joinedload(TournamentEnrollment.tournament).joinedload(Tournament.plan)
        )
        .filter(TournamentEnrollment.club_id == club.id)
        .order_by(TournamentEnrollment.created_at.desc())
        .all()
    )
    
    result = []
    for enrollment in enrollments:
        # Create a response object with tournament details
        enrollment_dict = {
            "id": enrollment.id,
            "tournament_id": enrollment.tournament_id,
            "club_id": enrollment.club_id,
            "enrolled_by": enrollment.enrolled_by,
            "enrolled_fee": enrollment.enrolled_fee,
            "payment_status": enrollment.payment_status,
            "created_at": enrollment.created_at,
            "updated_at": enrollment.updated_at,
            "tournament": TournamentResponse.model_validate(enrollment.tournament)
        }
        result.append(MyEnrollmentResponse(**enrollment_dict))
    
    return result