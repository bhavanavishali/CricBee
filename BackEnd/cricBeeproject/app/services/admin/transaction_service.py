from sqlalchemy.orm import Session, joinedload
from app.models.admin.transaction import AdminWallet, Transaction, TransactionType, TransactionStatus, TransactionDirection
from app.models.user import User, UserRole
from decimal import Decimal
from datetime import datetime
from typing import Optional, Tuple, Dict, List
import uuid

def generate_transaction_id() -> str:
   return f"TXN{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:12].upper()}"

def get_or_create_admin_wallet(db: Session, admin_id: int) -> AdminWallet:
    wallet = db.query(AdminWallet).filter(AdminWallet.admin_id == admin_id).first()
    if not wallet:
        wallet = AdminWallet(admin_id=admin_id, balance=Decimal('0.00'))
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def create_transaction(
    db: Session,
    transaction_type: str,
    amount: Decimal,
    status: str = TransactionStatus.SUCCESS.value,
    tournament_id: Optional[int] = None,
    razorpay_payment_id: Optional[str] = None,
    razorpay_order_id: Optional[str] = None,
    description: Optional[str] = None,
    transaction_id: Optional[str] = None,
    transaction_direction: str = TransactionDirection.CREDIT.value,
    wallet_id: Optional[int] = None,
    organizer_id: Optional[int] = None,
    club_manager_id: Optional[int] = None
) -> Transaction:
    
    if not wallet_id and not organizer_id and not club_manager_id:
        raise ValueError("Either wallet_id, organizer_id, or club_manager_id must be provided")

    ids_provided = sum([bool(wallet_id), bool(organizer_id), bool(club_manager_id)])
    if ids_provided > 1:
        raise ValueError("Cannot specify multiple IDs (wallet_id, organizer_id, club_manager_id)")
    
    transaction_id = transaction_id or generate_transaction_id()
    
    transaction = Transaction(
        transaction_id=transaction_id,
        wallet_id=wallet_id,
        organizer_id=organizer_id,
        club_manager_id=club_manager_id,
        transaction_type=transaction_type,
        transaction_direction=transaction_direction,
        amount=amount,
        status=status,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=description or f"{transaction_type} transaction"
    )
    db.add(transaction)
    return transaction

def add_to_admin_wallet(
    db: Session,
    admin_id: int,
    amount: Decimal,
    tournament_id: Optional[int] = None,
    razorpay_payment_id: Optional[str] = None,
    razorpay_order_id: Optional[str] = None,
    description: Optional[str] = None,
    transaction_id: Optional[str] = None
) -> Tuple[Transaction, AdminWallet]:
    
 
    admin = db.query(User).filter(User.id == admin_id, User.role == UserRole.ADMIN).first()
    if not admin:
        raise ValueError("Admin user not found")
    
   
    wallet = get_or_create_admin_wallet(db, admin_id)
    
   
    transaction = create_transaction(
        db=db,
        wallet_id=wallet.id,
        transaction_type=TransactionType.TOURNAMENT_PAYMENT.value,
        transaction_direction=TransactionDirection.CREDIT.value,  
        amount=amount,
        status=TransactionStatus.SUCCESS.value,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=description,
        transaction_id=transaction_id
    )

    wallet.balance += amount
    wallet.updated_at = datetime.now()
    
    db.flush()
    return transaction, wallet

def get_all_transactions(db: Session, skip: int = 0, limit: int = 100):
   
    transactions = db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)
    ).options(
        joinedload(Transaction.tournament),
        joinedload(Transaction.organizer),
        joinedload(Transaction.club_manager)
    ).order_by(
        Transaction.created_at.desc()
    ).offset(skip).limit(limit).all()
    return transactions

def get_transactions_count(db: Session) -> int:
    
    return db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)  
    ).count()

def get_admin_wallet(db: Session, admin_id: int) -> AdminWallet:
    
    return get_or_create_admin_wallet(db, admin_id)

def create_organizer_transaction(
    db: Session,
    organizer_id: int,
    transaction_type: str,
    amount: Decimal,
    status: str = TransactionStatus.SUCCESS.value,
    tournament_id: Optional[int] = None,
    razorpay_payment_id: Optional[str] = None,
    razorpay_order_id: Optional[str] = None,
    description: Optional[str] = None,
    transaction_id: Optional[str] = None,
    transaction_direction: str = TransactionDirection.DEBIT.value
) -> Transaction:
    
    organizer = db.query(User).filter(User.id == organizer_id, User.role == UserRole.ORGANIZER).first()
    if not organizer:
        raise ValueError("Organizer user not found")
    
    return create_transaction(
        db=db,
        organizer_id=organizer_id,
        transaction_type=transaction_type,
        transaction_direction=transaction_direction,
        amount=amount,
        status=status,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=description,
        transaction_id=transaction_id
    )

def refund_tournament_transactions(
    db: Session,
    tournament_id: int,
    organizer_id: int
) -> Tuple[Transaction, Transaction]:
   
    organizer_transaction = db.query(Transaction).filter(
        Transaction.tournament_id == tournament_id,
        Transaction.organizer_id == organizer_id,
        Transaction.transaction_type == TransactionType.TOURNAMENT_PAYMENT.value,
        Transaction.transaction_direction == TransactionDirection.DEBIT.value,
        Transaction.status == TransactionStatus.SUCCESS.value
    ).first()
    
    if not organizer_transaction:
        raise ValueError("Organizer transaction not found for refund")
    
 
    admin_transaction = db.query(Transaction).filter(
        Transaction.tournament_id == tournament_id,
        Transaction.wallet_id.isnot(None),
        Transaction.transaction_type == TransactionType.TOURNAMENT_PAYMENT.value,
        Transaction.transaction_direction == TransactionDirection.CREDIT.value,
        Transaction.status == TransactionStatus.SUCCESS.value
    ).first()
    
    if not admin_transaction:
        raise ValueError("Admin transaction not found for refund")

    # Do not modify the original tournament-create transaction; only create a new refund transaction.

    admin_transaction.status = TransactionStatus.REFUNDED.value
    admin_transaction.transaction_direction = TransactionDirection.DEBIT.value
    admin_transaction.updated_at = datetime.now()
    admin_transaction.description = f"Refund for tournament cancellation - {admin_transaction.description or ''}"
    

    wallet = db.query(AdminWallet).filter(AdminWallet.id == admin_transaction.wallet_id).first()
    if wallet:
        wallet.balance -= organizer_transaction.amount
        wallet.updated_at = datetime.now()

    # New transaction only: type REFUND, status refunded, direction credit; adds to organizer wallet balance
    create_organizer_transaction(
        db=db,
        organizer_id=organizer_id,
        transaction_type=TransactionType.REFUND.value,
        transaction_direction=TransactionDirection.CREDIT.value,
        amount=organizer_transaction.amount,
        status=TransactionStatus.REFUNDED.value,
        tournament_id=tournament_id,
        description=f"Refund for tournament cancellation (tournament_id={tournament_id})",
        transaction_id=generate_transaction_id(),
    )

    db.flush()
    return organizer_transaction, admin_transaction

def get_financial_statistics(db: Session) -> Dict:
    
    transactions = db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)
    ).all()
    
    total_revenue = Decimal('0.00')
    total_debits = Decimal('0.00')
    total_refunds = Decimal('0.00')
    
    for transaction in transactions:
        if transaction.status == TransactionStatus.REFUNDED.value:
            total_refunds += transaction.amount
        elif transaction.status == TransactionStatus.SUCCESS.value:
            if transaction.transaction_direction == TransactionDirection.CREDIT.value:
                total_revenue += transaction.amount
            elif transaction.transaction_direction == TransactionDirection.DEBIT.value:
                total_debits += transaction.amount
    
    net_balance = total_revenue - total_debits - total_refunds
    
    return {
        "total_revenue": float(total_revenue),
        "total_debits": float(total_debits),
        "total_refunds": float(total_refunds),
        "net_balance": float(net_balance),
        "total_transactions": len(transactions)
    }

def get_transactions_by_date_range(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Transaction]:
    
    query = db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)
    ).options(
        joinedload(Transaction.tournament),
        joinedload(Transaction.organizer),
        joinedload(Transaction.club_manager)
    )
    
    if start_date:
        query = query.filter(Transaction.created_at >= start_date)
    if end_date:
        query = query.filter(Transaction.created_at <= end_date)
    
    return query.order_by(Transaction.created_at.desc()).all()