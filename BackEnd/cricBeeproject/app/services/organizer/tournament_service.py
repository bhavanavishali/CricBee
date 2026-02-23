from sqlalchemy.orm import Session, joinedload
from app.models.organizer.tournament import Tournament, TournamentDetails, TournamentPayment, TournamentStatus, PaymentStatus, TournamentEnrollment
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.models.admin.transaction import Transaction
from app.schemas.organizer.tournament import (
    TournamentCreate,
    TournamentResponse,
    TournamentUpdate,
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

    
    if tournament.status == TournamentStatus.CANCELLED.value:
        return False
    
    
    if tournament.status == TournamentStatus.COMPLETED.value and tournament.winner_team_id:
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
    try:
        
        organizer = db.query(User).filter(User.id == organizer_id).first()
        if not organizer:
            raise ValueError("Organizer not found. Please log in again.")
        
        
        plan = db.query(TournamentPricingPlan).filter(
            TournamentPricingPlan.id == tournament_data.plan_id,
            TournamentPricingPlan.status == "active"
        ).first()
        
        if not plan:
            raise ValueError("Invalid or inactive pricing plan. Please select a valid plan.")
        
        
        if not tournament_data.tournament_name or not tournament_data.tournament_name.strip():
            raise ValueError("Tournament name is required")
        
        if not tournament_data.details:
            raise ValueError("Tournament details are required")
        
        
        tournament = Tournament(
            tournament_name=tournament_data.tournament_name,
            organizer_id=organizer_id,
            plan_id=tournament_data.plan_id,
            status=TournamentStatus.PENDING_PAYMENT.value
        )
        db.add(tournament)
        db.flush()  
        
        
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
        
        
        max_attempts = 5
        transaction_id = None
        for attempt in range(max_attempts):
            transaction_id = generate_transaction_id()
            
            existing = db.query(TournamentPayment).filter(
                TournamentPayment.transaction_id == transaction_id
            ).first()
            if not existing:
                break
            if attempt == max_attempts - 1:
                raise ValueError("Failed to generate unique transaction ID. Please try again.")
        
        payment = TournamentPayment(
            tournament_id=tournament.id,
            amount=plan.amount,
            payment_status=PaymentStatus.PENDING.value,
            transaction_id=transaction_id
        )
        db.add(payment)
        db.flush()
        
        
        try:
            razorpay_order = create_razorpay_order(
                amount=plan.amount,
                receipt=f"tournament_{tournament.id}"
            )
        except ValueError as e:
            
            db.rollback()
            raise ValueError(f"Payment gateway error: {str(e)}")
        
        
        razorpay_order_id = razorpay_order["id"]
        existing_order = db.query(TournamentPayment).filter(
            TournamentPayment.razorpay_order_id == razorpay_order_id
        ).first()
        if existing_order:
            db.rollback()
            raise ValueError("Payment order ID already exists. Please try again.")
        
        payment.razorpay_order_id = razorpay_order_id
        db.commit()
        
        
        tournament_with_relations = db.query(Tournament).options(
            joinedload(Tournament.details),
            joinedload(Tournament.payment),
            joinedload(Tournament.plan),
            joinedload(Tournament.winner_team)
        ).filter(Tournament.id == tournament.id).first()
        
        if not tournament_with_relations:
            raise ValueError("Failed to load tournament after creation")
        
        
        try:
            tournament_response = TournamentResponse.model_validate(tournament_with_relations)
        except Exception as validation_error:
            import logging
            logging.error(f"TournamentResponse validation error: {str(validation_error)}")
            logging.error(f"Tournament data: id={tournament_with_relations.id}, name={tournament_with_relations.tournament_name}")
            logging.error(f"Has details: {tournament_with_relations.details is not None}")
            logging.error(f"Has payment: {tournament_with_relations.payment is not None}")
            raise ValueError(f"Failed to format tournament response: {str(validation_error)}")
        
        return {
            "tournament": tournament_response,
            "razorpay_order": {
                "order_id": razorpay_order["id"],
                "amount": float(plan.amount),
                "currency": "INR",
                "key": settings.razorpay_key_id or ""
            }
        }
    except ValueError:
        
        raise
    except Exception as e:
        
        db.rollback()
        import logging
        import traceback
        error_str = str(e)
        error_type = type(e).__name__
        
        logging.error(f"Unexpected error creating tournament - Type: {error_type}, Message: {error_str}")
        logging.error(traceback.format_exc())
        
        # Handle PostgreSQL constraint violations specifically
        if "psycopg2" in error_type.lower() or "IntegrityError" in error_type or "unique constraint" in error_str.lower():
            if "transaction_id" in error_str.lower():
                error_msg = "Transaction ID conflict. Please try again."
            elif "tournament_id" in error_str.lower() and "tournament_payments" in error_str.lower():
                error_msg = "A payment record already exists for this tournament."
            elif "tournament_id" in error_str.lower() and "tournament_details" in error_str.lower():
                error_msg = "Tournament details already exist. Please try again."
            elif "razorpay_order_id" in error_str.lower():
                error_msg = "Payment order ID conflict. Please try again."
            elif "foreign key" in error_str.lower() or "violates foreign key constraint" in error_str.lower():
                if "users.id" in error_str.lower():
                    error_msg = "Invalid organizer ID. Please log in again."
                elif "tournament_pricing_plans.id" in error_str.lower():
                    error_msg = "Invalid pricing plan selected. Please choose a valid plan."
                else:
                    error_msg = "Database constraint violation. Please check your input data."
            else:
                error_msg = f"Database constraint error: {error_str[:200]}"
        elif "not null constraint" in error_str.lower() or "null value" in error_str.lower():
            error_msg = "Required field is missing. Please fill all required fields."
        else:
            error_msg = f"Failed to create tournament: {error_str[:200]}"
        
        raise ValueError(error_msg)
    
def verify_and_complete_payment(
    db: Session,
    tournament_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> TournamentResponse:
   
    tournament = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment),
        joinedload(Tournament.plan),
        joinedload(Tournament.winner_team)
    ).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise ValueError("Tournament not found")
    
    payment = db.query(TournamentPayment).filter(
        TournamentPayment.tournament_id == tournament_id
    ).first()
    
    if not payment:
        raise ValueError("Payment record not found")
    
   
    if not verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        raise ValueError("Invalid payment signature")
    
    
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.payment_status = PaymentStatus.SUCCESS.value
    payment.payment_date = datetime.now()
    
    
    if not payment.transaction_id:
        payment.transaction_id = generate_transaction_id()
    
    
    organizer_transaction_id = generate_transaction_id()
    organizer_transaction = create_organizer_transaction(
        db=db,
        organizer_id=tournament.organizer_id,
        transaction_type=TransactionType.TOURNAMENT_PAYMENT.value,
        transaction_direction=TransactionDirection.DEBIT.value,  
        amount=payment.amount,
        status=TransactionStatus.SUCCESS.value,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=f"Tournament payment for {tournament.tournament_name}",
        transaction_id=organizer_transaction_id
    )
    
   
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        # Add payment to admin wallet 
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
        
        payment.transaction_id = organizer_transaction.transaction_id
    
    
    tournament.status = TournamentStatus.REGISTRATION_OPEN.value
    _sync_tournament_status(db, tournament)
    
    db.commit()
    db.refresh(tournament)
    
    return TournamentResponse.model_validate(tournament)

def get_organizer_tournaments(db: Session, organizer_id: int) -> List[TournamentResponse]:
#    get all tournaments for organizer.
    tournaments = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment),
        joinedload(Tournament.plan),
        joinedload(Tournament.winner_team)
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
            payment_status=transaction.status,              payment_date=transaction.created_at,  
            created_at=transaction.created_at
        )
        for transaction, tournament_name in transactions
    ]

def get_organizer_wallet_balance(db: Session, organizer_id: int) -> Decimal:

    transactions = db.query(Transaction).filter(
        Transaction.organizer_id == organizer_id,
        Transaction.status.in_([TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value]),
        Transaction.transaction_type != TransactionType.TOURNAMENT_PAYMENT.value 
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
   
   
    tournament = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment),
        joinedload(Tournament.plan),
        joinedload(Tournament.winner_team)
    ).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    
    if not tournament.details:
        raise ValueError("Tournament details not found")
    
    enrolled_clubs_count = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.tournament_id == tournament_id,
        TournamentEnrollment.payment_status == PaymentStatus.SUCCESS.value
    ).count()
  
    today = date.today()
    registration_end_date = tournament.details.registration_end_date
    
    if tournament.status == TournamentStatus.CANCELLED.value:
        raise ValueError("Tournament is already cancelled")
    
    if today > registration_end_date:
        if enrolled_clubs_count > 0:
            raise ValueError(f"Tournament cannot be cancelled after registration end date. Please remove and refund all enrolled clubs first. {enrolled_clubs_count} club(s) still enrolled.")
    else:
       
        if enrolled_clubs_count > 0:
            raise ValueError(f"Please remove and refund all enrolled clubs before cancelling the tournament. {enrolled_clubs_count} club(s) still enrolled.")
    
  
    if not tournament.payment or tournament.payment.payment_status != PaymentStatus.SUCCESS.value:
        raise ValueError("Tournament payment not completed, cannot refund")

    if tournament.payment.payment_status == PaymentStatus.REFUNDED.value:
        raise ValueError("Tournament payment already refunded")
    
    
    
    try:
        refund_tournament_transactions(
            db=db,
            tournament_id=tournament_id,
            organizer_id=organizer_id
        )
    except ValueError as e:
        raise ValueError(f"Failed to refund transactions: {str(e)}")
    
    
    tournament.status = TournamentStatus.CANCELLED.value
    tournament.updated_at = datetime.now()
    
   
    tournament.payment.payment_status = PaymentStatus.REFUNDED.value
    tournament.payment.updated_at = datetime.now()
    
    db.add(tournament) 
    db.commit()
    db.refresh(tournament)
    
    return TournamentResponse.model_validate(tournament)

def update_tournament(
    db: Session,
    tournament_id: int,
    tournament_data: TournamentUpdate,
    organizer_id: int
) -> TournamentResponse:
    
    tournament = db.query(Tournament).options(
        joinedload(Tournament.details),
        joinedload(Tournament.payment),
        joinedload(Tournament.plan),
        joinedload(Tournament.winner_team)
    ).filter(
        Tournament.id == tournament_id,
        Tournament.organizer_id == organizer_id
    ).first()
    
    if not tournament:
        raise ValueError("Tournament not found or access denied")
    
    editable_statuses = [
        TournamentStatus.PENDING_PAYMENT.value,
        TournamentStatus.REGISTRATION_OPEN.value,
        TournamentStatus.REGISTRATION_END.value
    ]
    
    if tournament.status not in editable_statuses:
        raise ValueError("Tournament cannot be edited in current status")
    
    if tournament.status == TournamentStatus.CANCELLED.value:
        raise ValueError("Cancelled tournament cannot be edited")
    
    if tournament_data.tournament_name and tournament_data.tournament_name.strip():
        tournament.tournament_name = tournament_data.tournament_name.strip()
    
    if tournament_data.details and tournament.details:
        details = tournament.details
        
        if tournament_data.details.overs is not None:
            details.overs = tournament_data.details.overs
        
        if tournament_data.details.start_date is not None:
            details.start_date = tournament_data.details.start_date
        
        if tournament_data.details.end_date is not None:
            details.end_date = tournament_data.details.end_date
        
        if tournament_data.details.registration_start_date is not None:
            details.registration_start_date = tournament_data.details.registration_start_date
        
        if tournament_data.details.registration_end_date is not None:
            details.registration_end_date = tournament_data.details.registration_end_date
        
        if tournament_data.details.location and tournament_data.details.location.strip():
            details.location = tournament_data.details.location.strip()
        
        if tournament_data.details.venue_details is not None:
            if tournament_data.details.venue_details.strip():
                details.venue_details = tournament_data.details.venue_details.strip()
            else:
                details.venue_details = None
        
        if tournament_data.details.team_range and tournament_data.details.team_range.strip():
            details.team_range = tournament_data.details.team_range.strip()
        
        if tournament_data.details.is_public is not None:
            details.is_public = tournament_data.details.is_public
        
        if tournament_data.details.enrollment_fee is not None:
            details.enrollment_fee = tournament_data.details.enrollment_fee
        
        if tournament_data.details.prize_amount is not None:
            details.prize_amount = tournament_data.details.prize_amount
        
        details.updated_at = datetime.now()
    
    tournament.updated_at = datetime.now()
    
    _sync_tournament_status(db, tournament)
    
    db.commit()
    db.refresh(tournament)
    
    return TournamentResponse.model_validate(tournament)

def get_finance_report(
    db: Session,
    organizer_id: int,
    filter_type: str,
    start_date: datetime = None,
    end_date: datetime = None
) -> dict:
    
    from datetime import timedelta
    from sqlalchemy import func, case
    
    
    now = datetime.now()
    
    if filter_type == 'weekly':
        start_date = now - timedelta(days=7)
        end_date = now
    elif filter_type == 'monthly':
        start_date = now - timedelta(days=30)
        end_date = now
    elif filter_type == 'yearly':
        start_date = now - timedelta(days=365)
        end_date = now
    elif filter_type == 'custom':
        if not start_date or not end_date:
            raise ValueError("Start date and end date are required for custom filter")
    else:
        raise ValueError("Invalid filter type. Must be 'weekly', 'monthly', 'yearly', or 'custom'")
    
    
    transactions = (
        db.query(
            Transaction.transaction_id,
            Transaction.tournament_id,
            Tournament.tournament_name,
            Transaction.amount,
            Transaction.status,
            Transaction.description,
            Transaction.transaction_direction,
            Transaction.transaction_type,
            Transaction.created_at
        )
        .outerjoin(Tournament, Tournament.id == Transaction.tournament_id)
        .filter(
            Transaction.organizer_id == organizer_id,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )
    
   
    total_revenue = Decimal('0.00')
    total_debits = Decimal('0.00')
    
    for trans in transactions:
        if trans.status == TransactionStatus.SUCCESS.value:
            if trans.transaction_direction == TransactionDirection.CREDIT.value:
                total_revenue += trans.amount
            elif trans.transaction_direction == TransactionDirection.DEBIT.value:
                total_debits += trans.amount
    
    net_balance = total_revenue - total_debits
    
    # Format transactions
    from app.schemas.organizer.tournament import FinanceReportTransactionResponse
    transaction_list = [
        FinanceReportTransactionResponse(
            transaction_id=trans.transaction_id,
            tournament_id=trans.tournament_id,
            tournament_name=trans.tournament_name or "N/A",
            tournament_type=None,  
            amount=trans.amount,
            status=trans.status,
            description=trans.description or "",
            transaction_direction=trans.transaction_direction,
            transaction_type=trans.transaction_type,
            created_at=trans.created_at
        )
        for trans in transactions
    ]
    
    return {
        "total_revenue": total_revenue,
        "total_debits": total_debits,
        "net_balance": net_balance,
        "total_transactions": len(transaction_list),
        "transactions": transaction_list
    }