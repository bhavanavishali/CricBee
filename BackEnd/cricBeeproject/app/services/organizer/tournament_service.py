from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentStatus, PaymentStatus
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.models.admin.transaction import Transaction
from app.schemas.organizer.tournament import (
    TournamentCreate,
    TournamentResponse,
    OrganizerTransactionResponse
)
from app.services.organizer.payment_service import create_razorpay_order, verify_payment_signature
from app.core.config import settings
from datetime import datetime, date
from typing import List
from app.services.admin.transaction_service import (
    add_to_admin_wallet, 
    generate_transaction_id,
    create_organizer_transaction,
    refund_tournament_transactions
)
from app.models.admin.transaction import TransactionType, TransactionStatus, TransactionDirection
from app.models.user import UserRole, User
from app.models.organizer.tournament import TournamentStatus, PaymentStatus
from decimal import Decimal

LEGACY_STATUS_MAP = {
    "payment_completed": TournamentStatus.REGISTRATION_OPEN.value,
    "active": TournamentStatus.TOURNAMENT_START.value,
    "completed": TournamentStatus.TOURNAMENT_END.value,
}


def _sync_tournament_status(db: Session, tournament: Tournament) -> bool:
    
    changed = False

    # Don't sync status if tournament is cancelled - preserve cancelled status
    if tournament.status == TournamentStatus.CANCELLED.value:
        return False

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
        is_public=tournament_data.details.is_public,
        enrollment_fee=tournament_data.details.enrollment_fee
    )
    db.add(details)
    
    # Create payment record
    payment = TournamentPayment(
        tournament_id=tournament.id,
        amount=plan.amount,
        payment_status=PaymentStatus.PENDING.value
    )
    payment.transaction_id = generate_transaction_id()
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
    
    # Ensure payment has a transaction ID (base transaction ID for reference)
    if not payment.transaction_id:
        payment.transaction_id = generate_transaction_id()
    
    # Create organizer transaction (DEBIT, SUCCESS) with unique transaction ID
    organizer_transaction_id = generate_transaction_id()
    organizer_transaction = create_organizer_transaction(
        db=db,
        organizer_id=tournament.organizer_id,
        transaction_type=TransactionType.TOURNAMENT_PAYMENT.value,
        transaction_direction=TransactionDirection.DEBIT.value,  # Organizer pays = Debit
        amount=payment.amount,
        status=TransactionStatus.SUCCESS.value,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=f"Tournament payment for {tournament.tournament_name}",
        transaction_id=organizer_transaction_id
    )
    
    # Get admin user (assuming first admin or you can modify this logic)
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        # Add payment to admin wallet (CREDIT, SUCCESS) with unique transaction ID
        admin_transaction_id = generate_transaction_id()
        admin_transaction, wallet = add_to_admin_wallet(
            db=db,
            admin_id=admin.id,
            amount=payment.amount,
            tournament_id=tournament_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_order_id=razorpay_order_id,
            description=f"Tournament payment for {tournament.tournament_name}",
            transaction_id=admin_transaction_id
        )
        # Update payment with organizer transaction_id as the primary reference
        payment.transaction_id = organizer_transaction.transaction_id
    
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


def get_organizer_transactions(db: Session, organizer_id: int) -> List[OrganizerTransactionResponse]:
    
    transactions = (
        db.query(Transaction, Tournament.tournament_name)
        .join(Tournament, Tournament.id == Transaction.tournament_id)
        .filter(Transaction.organizer_id == organizer_id)
        .order_by(Transaction.created_at.desc())
        .all()
    )
    
    return [
        OrganizerTransactionResponse(
            tournament_id=transaction.tournament_id,
            tournament_name=tournament_name,
            transaction_id=transaction.transaction_id,
            transaction_type=transaction.transaction_type,
            transaction_direction=transaction.transaction_direction,
            amount=transaction.amount,
            payment_status=transaction.status,  # Use transaction status
            payment_date=transaction.created_at,  # Use transaction created_at as payment_date
            created_at=transaction.created_at
        )
        for transaction, tournament_name in transactions
    ]

def get_organizer_wallet_balance(db: Session, organizer_id: int) -> Decimal:

    transactions = db.query(Transaction).filter(
        Transaction.organizer_id == organizer_id,
        Transaction.status.in_([TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value]),
        Transaction.transaction_type != TransactionType.TOURNAMENT_PAYMENT.value  # Exclude tournament creation payments
    ).all()
    
    balance = Decimal('0.00')
    for transaction in transactions:
        if transaction.transaction_direction == TransactionDirection.CREDIT.value:
            balance += transaction.amount
        elif transaction.transaction_direction == TransactionDirection.DEBIT.value:
            balance -= transaction.amount
    
    return balance

def cancel_tournament(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> TournamentResponse:
   
    # Get tournament with relationships
    tournament = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment)
    ).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    # Check if tournament is already cancelled
    if tournament.status == TournamentStatus.CANCELLED.value:
        raise ValueError("Tournament is already cancelled")
    
    # Check if tournament has details (registration dates)
    if not tournament.details:
        raise ValueError("Tournament details not found")
    
    # Check if cancellation is allowed (only before registration end date)
    today = date.today()
    registration_end_date = tournament.details.registration_end_date
    
    if today > registration_end_date:
        raise ValueError("Tournament cannot be cancelled after registration end date")
    
    # Check if payment was successful
    if not tournament.payment or tournament.payment.payment_status != PaymentStatus.SUCCESS.value:
        raise ValueError("Tournament payment not completed, cannot refund")
    
    # Check if already refunded
    if tournament.payment.payment_status == PaymentStatus.REFUNDED.value:
        raise ValueError("Tournament payment already refunded")
    
    # Refund transactions (update status and direction, update admin wallet)
    try:
        refund_tournament_transactions(
            db=db,
            tournament_id=tournament_id,
            organizer_id=organizer_id
        )
    except ValueError as e:
        raise ValueError(f"Failed to refund transactions: {str(e)}")
    
    # Update tournament status to CANCELLED
    tournament.status = TournamentStatus.CANCELLED.value
    tournament.updated_at = datetime.now()
    
    # Update payment status to REFUNDED
    tournament.payment.payment_status = PaymentStatus.REFUNDED.value
    tournament.payment.updated_at = datetime.now()
    
    db.add(tournament)  # Explicitly add to ensure update is tracked
    db.commit()
    db.refresh(tournament)
    
    return TournamentResponse.model_validate(tournament)