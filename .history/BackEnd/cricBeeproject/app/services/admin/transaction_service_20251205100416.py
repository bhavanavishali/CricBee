from sqlalchemy.orm import Session
from app.models.admin.transaction import AdminWallet, Transaction, TransactionType, TransactionStatus, TransactionDirection
from app.models.user import User, UserRole
from decimal import Decimal
from datetime import datetime
from typing import Optional, Tuple
import uuid

def generate_transaction_id() -> str:
    #Generate a unique transaction id
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
    organizer_id: Optional[int] = None
) -> Transaction:
    """Create a transaction for either admin (wallet_id) or organizer (organizer_id)"""
    if not wallet_id and not organizer_id:
        raise ValueError("Either wallet_id or organizer_id must be provided")
    if wallet_id and organizer_id:
        raise ValueError("Cannot specify both wallet_id and organizer_id")
    
    transaction_id = transaction_id or generate_transaction_id()
    
    transaction = Transaction(
        transaction_id=transaction_id,
        wallet_id=wallet_id,
        organizer_id=organizer_id,
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
    
    # Get admin user
    admin = db.query(User).filter(User.id == admin_id, User.role == UserRole.ADMIN).first()
    if not admin:
        raise ValueError("Admin user not found")
    
    # Get or create wallet
    wallet = get_or_create_admin_wallet(db, admin_id)
    
    # Create transaction with CREDIT direction (money coming in for admin)
    transaction = create_transaction(
        db=db,
        wallet_id=wallet.id,
        transaction_type=TransactionType.TOURNAMENT_PAYMENT.value,
        transaction_direction=TransactionDirection.CREDIT.value,  # Admin receives money = Credit
        amount=amount,
        status=TransactionStatus.SUCCESS.value,
        tournament_id=tournament_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=razorpay_order_id,
        description=description,
        transaction_id=transaction_id
    )
    
    # Update wallet balance
    wallet.balance += amount
    wallet.updated_at = datetime.now()
    
    db.flush()
    return transaction, wallet

def get_all_transactions(db: Session, skip: int = 0, limit: int = 100):
    """Get all admin wallet transactions with pagination (only transactions with wallet_id)"""
    transactions = db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)  # Only admin wallet transactions
    ).order_by(
        Transaction.created_at.desc()
    ).offset(skip).limit(limit).all()
    return transactions

def get_transactions_count(db: Session) -> int:
    """Get total count of admin wallet transactions"""
    return db.query(Transaction).filter(
        Transaction.wallet_id.isnot(None)  # Only admin wallet transactions
    ).count()

def get_admin_wallet(db: Session, admin_id: int) -> AdminWallet:
    """Get admin wallet, create if it doesn't exist"""
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
    """Create a transaction for an organizer"""
    # Verify organizer exists
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
    """
    Refund tournament payment by updating existing transactions.
    Updates organizer transaction: status=REFUNDED, direction=CREDIT
    Updates admin transaction: status=REFUNDED, direction=DEBIT
    Updates admin wallet balance (debits the refunded amount)
    """
    # Find organizer transaction (original: DEBIT, SUCCESS)
    organizer_transaction = db.query(Transaction).filter(
        Transaction.tournament_id == tournament_id,
        Transaction.organizer_id == organizer_id,
        Transaction.transaction_type == TransactionType.TOURNAMENT_PAYMENT.value,
        Transaction.transaction_direction == TransactionDirection.DEBIT.value,
        Transaction.status == TransactionStatus.SUCCESS.value
    ).first()
    
    if not organizer_transaction:
        raise ValueError("Organizer transaction not found for refund")
    
    # Find admin transaction (original: CREDIT, SUCCESS)
    admin_transaction = db.query(Transaction).filter(
        Transaction.tournament_id == tournament_id,
        Transaction.wallet_id.isnot(None),
        Transaction.transaction_type == TransactionType.TOURNAMENT_PAYMENT.value,
        Transaction.transaction_direction == TransactionDirection.CREDIT.value,
        Transaction.status == TransactionStatus.SUCCESS.value
    ).first()
    
    if not admin_transaction:
        raise ValueError("Admin transaction not found for refund")
    
    # Update organizer transaction: REFUNDED, CREDIT
    organizer_transaction.status = TransactionStatus.REFUNDED.value
    organizer_transaction.transaction_direction = TransactionDirection.CREDIT.value
    organizer_transaction.updated_at = datetime.now()
    organizer_transaction.description = f"Refund for tournament cancellation - {organizer_transaction.description or ''}"
    
    # Update admin transaction: REFUNDED, DEBIT
    admin_transaction.status = TransactionStatus.REFUNDED.value
    admin_transaction.transaction_direction = TransactionDirection.DEBIT.value
    admin_transaction.updated_at = datetime.now()
    admin_transaction.description = f"Refund for tournament cancellation - {admin_transaction.description or ''}"
    
    # Update admin wallet balance (debit the refunded amount)
    wallet = db.query(AdminWallet).filter(AdminWallet.id == admin_transaction.wallet_id).first()
    if wallet:
        wallet.balance -= organizer_transaction.amount
        wallet.updated_at = datetime.now()
    
    db.flush()
    return organizer_transaction, admin_transaction