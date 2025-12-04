from sqlalchemy.orm import Session
from app.models.admin.transaction import AdminWallet, Transaction, TransactionType, TransactionStatus
from app.models.user import User, UserRole
from decimal import Decimal
from datetime import datetime
from typing import Optional, Tuple
import uuid

def generate_transaction_id() -> str:
    #Generate a unique transaction id
    return f"TXN{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:12].upper()}"

def get_or_create_admin_wallet(db: Session, admin_id: int) -> AdminWallet:
    """Get or create admin wallet"""
    wallet = db.query(AdminWallet).filter(AdminWallet.admin_id == admin_id).first()
    if not wallet:
        wallet = AdminWallet(admin_id=admin_id, balance=Decimal('0.00'))
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

def create_transaction(
    db: Session,
    wallet_id: int,
    transaction_type: str,
    amount: Decimal,
    status: str = TransactionStatus.SUCCESS.value,
    tournament_id: Optional[int] = None,
    razorpay_payment_id: Optional[str] = None,
    razorpay_order_id: Optional[str] = None,
    description: Optional[str] = None,
    transaction_id: Optional[str] = None
) -> Transaction:
    
    transaction_id = transaction_id or generate_transaction_id()
    
    transaction = Transaction(
        transaction_id=transaction_id,
        wallet_id=wallet_id,
        transaction_type=transaction_type,
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
    
    # Create transaction
    transaction = create_transaction(
        db=db,
        wallet_id=wallet.id,
        transaction_type=TransactionType.TOURNAMENT_PAYMENT.value,
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
    """Get all transactions with pagination"""
    transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).offset(skip).limit(limit).all()
    return transactions

def get_transactions_count(db: Session) -> int:
    """Get total count of transactions"""
    return db.query(Transaction).count()

def get_admin_wallet(db: Session, admin_id: int) -> AdminWallet:
    """Get admin wallet, create if it doesn't exist"""
    return get_or_create_admin_wallet(db, admin_id)