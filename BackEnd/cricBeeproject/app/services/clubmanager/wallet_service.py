
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.admin.transaction import Transaction, TransactionDirection, TransactionStatus


def get_club_manager_transactions(db: Session, club_manager_id: int) -> list:
    
    transactions = db.query(Transaction).filter(
        Transaction.club_manager_id == club_manager_id
    ).order_by(Transaction.created_at.desc()).all()
    return transactions


def get_club_manager_wallet_balance(db: Session, club_manager_id: int) -> float:
    
    credit_total = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.club_manager_id == club_manager_id,
        Transaction.transaction_direction == TransactionDirection.CREDIT.value,
        Transaction.status.in_([TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value])
    ).scalar() or 0
    
    return float(credit_total)

