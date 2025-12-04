from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import UserListItem, UserStatusUpdate
from app.schemas.admin.plan_pricing import (
    TournamentPricingPlanCreate,
    TournamentPricingPlanUpdate,
    TournamentPricingPlanStatusUpdate,
    TournamentPricingPlanResponse
)
from app.schemas.admin.transaction import TransactionResponse, TransactionListResponse, AdminWalletResponse
from app.services.admin_service import get_all_users_except_admin, update_user_status
from app.services.admin.plan_pricing import (
    create_tournament_pricing_plan,
    get_all_tournament_pricing_plans,
    get_tournament_pricing_plan_by_id,
    update_tournament_pricing_plan,
    update_tournament_pricing_plan_status
)
from app.services.admin.transaction_service import get_all_transactions, get_transactions_count, get_admin_wallet
from app.utils.admin_dependencies import get_current_admin_user
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])


# User Management Endpoints
@router.get("/users", response_model=List[UserListItem])
def list_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):

    users = get_all_users_except_admin(db)
    return users


@router.patch("/users/{user_id}/status", response_model=UserListItem)
def update_user_active_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
   
    user = update_user_status(db, user_id, payload.is_active)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or cannot modify admin users"
        )
    
    return user


# Tournament Pricing Plan Endpoints

@router.post("/pricing-plans", response_model=TournamentPricingPlanResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_plan(
    plan_data: TournamentPricingPlanCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    ""
    # Validate status
    if plan_data.status not in ["active", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'inactive'"
        )
    
    plan = create_tournament_pricing_plan(db, plan_data)
    return plan


@router.get("/pricing-plans", response_model=List[TournamentPricingPlanResponse])
def list_all_pricing_plans(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    plans = get_all_tournament_pricing_plans(db)
    return plans


@router.get("/pricing-plans/{plan_id}", response_model=TournamentPricingPlanResponse)
def get_pricing_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    plan = get_tournament_pricing_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing plan not found"
        )
    return plan


@router.put("/pricing-plans/{plan_id}", response_model=TournamentPricingPlanResponse)
def update_pricing_plan(
    plan_id: int,
    plan_data: TournamentPricingPlanUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    if plan_data.status is not None and plan_data.status not in ["active", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'inactive'"
        )
    
    plan = update_tournament_pricing_plan(db, plan_id, plan_data)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing plan not found"
        )
    return plan


@router.patch("/pricing-plans/{plan_id}/status", response_model=TournamentPricingPlanResponse)
def update_pricing_plan_status(
    plan_id: int,
    status_data: TournamentPricingPlanStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    if status_data.status not in ["active", "inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'inactive'"
        )
    
    plan = update_tournament_pricing_plan_status(db, plan_id, status_data.status)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing plan not found"
        )
        return plan


@router.get("/wallet", response_model=AdminWalletResponse)
def get_wallet_balance(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get admin wallet balance"""
    wallet = get_admin_wallet(db, current_admin.id)
    return AdminWalletResponse.model_validate(wallet)


@router.get("/transactions", response_model=TransactionListResponse)
def list_all_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get all transactions"""
    transactions = get_all_transactions(db, skip=skip, limit=limit)
    total = get_transactions_count(db)
    
    return TransactionListResponse(
        transactions=[TransactionResponse.model_validate(t) for t in transactions],
        total=total,
        skip=skip,
        limit=limit
    )