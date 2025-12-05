from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.organizer.tournament import (
    TournamentCreate,
    TournamentResponse,
    PaymentVerification,
    OrganizerTransactionResponse,
    OrganizerWalletBalanceResponse
)
from app.services.organizer.tournament_service import (
    create_tournament_with_payment,
    verify_and_complete_payment,
    get_organizer_tournaments,
    get_organizer_transactions,
    cancel_tournament,
    get_organizer_wallet_balance
)
from app.models.admin.transaction import Transaction
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.schemas.admin.plan_pricing import TournamentPricingPlanResponse
from typing import List

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.get("/", response_model=List[TournamentResponse])
def get_my_tournaments(
    request: Request,
    db: Session = Depends(get_db)
):
      
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view tournaments"
        )
    
    tournaments = get_organizer_tournaments(db, current_user.id)
    return tournaments

@router.get("/pricing-plans", response_model=List[TournamentPricingPlanResponse])
def get_active_pricing_plans(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get active pricing plans for tournament creation"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view pricing plans"
        )
    
    plans = db.query(TournamentPricingPlan).filter(
        TournamentPricingPlan.status == "active"
    ).order_by(TournamentPricingPlan.amount.asc()).all()
    
    return [TournamentPricingPlanResponse.model_validate(plan) for plan in plans]

@router.post("/create", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_tournament(
    tournament_data: TournamentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    #Create tournament and initiate payment
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create tournaments"
        )
    
    try:
        result = create_tournament_with_payment(db, tournament_data, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/verify-payment", response_model=TournamentResponse)
def verify_payment(
    payment_data: PaymentVerification,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    
    try:
        tournament = verify_and_complete_payment(
            db,
            payment_data.tournament_id,
            payment_data.razorpay_order_id,
            payment_data.razorpay_payment_id,
            payment_data.razorpay_signature
        )
        
        # Verify organizer owns this tournament
        if tournament.organizer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return tournament
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/transactions", response_model=List[OrganizerTransactionResponse])
def get_transactions(
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view transactions"
        )
    
    return get_organizer_transactions(db, current_user.id)

@router.get("/wallet/balance", response_model=OrganizerWalletBalanceResponse)
def get_wallet_balance(
    request: Request,
    db: Session = Depends(get_db)
):
    #Get organizer wallet balance calculated from transactions
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view wallet balance"
        )
    
    balance = get_organizer_wallet_balance(db, current_user.id)
    total_transactions = db.query(Transaction).filter(
        Transaction.organizer_id == current_user.id
    ).count()
    
    return OrganizerWalletBalanceResponse(
        balance=balance,
        total_transactions=total_transactions
    )

@router.post("/{tournament_id}/cancel", response_model=TournamentResponse)
def cancel_tournament_endpoint(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #Cancel a tournament and refund the payment. Only allowed before registration end date.
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can cancel tournaments"
        )
    
    try:
        tournament = cancel_tournament(db, tournament_id, current_user.id)
        return tournament
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )