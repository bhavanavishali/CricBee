# api/v1/clubmanager/wallet.py
"""
Wallet & Transaction Management Routes
Handles wallet balance and transaction history
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.club_manager import (
    ClubManagerTransactionResponse, ClubManagerWalletBalanceResponse, 
    ClubManagerTransactionListResponse
)
from app.services.clubmanager.wallet_service import (
    get_club_manager_transactions, get_club_manager_wallet_balance
)
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/club-profile", tags=["wallet"])


@router.get("/transactions", response_model=ClubManagerTransactionListResponse)
def get_club_manager_transactions_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all transactions for the club manager"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view transactions"
        )
    
    try:
        transactions = get_club_manager_transactions(db, current_user.id)
        transaction_responses = []
        
        for transaction in transactions:
            tournament_name = None
            if transaction.tournament_id:
                from app.models.organizer.tournament import Tournament
                tournament = db.query(Tournament).filter(Tournament.id == transaction.tournament_id).first()
                if tournament:
                    tournament_name = tournament.tournament_name
            
            transaction_response = ClubManagerTransactionResponse(
                id=transaction.id,
                transaction_id=transaction.transaction_id,
                transaction_type=transaction.transaction_type,
                transaction_direction=transaction.transaction_direction,
                amount=float(transaction.amount),
                status=transaction.status,
                tournament_id=transaction.tournament_id,
                tournament_name=tournament_name,
                description=transaction.description,
                created_at=transaction.created_at,
                payment_date=transaction.created_at
            )
            transaction_responses.append(transaction_response)
        
        return ClubManagerTransactionListResponse(
            transactions=transaction_responses,
            total=len(transaction_responses)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )


@router.get("/wallet/balance", response_model=ClubManagerWalletBalanceResponse)
def get_club_manager_wallet_balance_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get wallet balance for the club manager"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view wallet balance"
        )
    
    try:
        balance = get_club_manager_wallet_balance(db, current_user.id)
        total_transactions = len(get_club_manager_transactions(db, current_user.id))
        
        return ClubManagerWalletBalanceResponse(
            balance=balance,
            total_transactions=total_transactions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch wallet balance: {str(e)}"
        )

