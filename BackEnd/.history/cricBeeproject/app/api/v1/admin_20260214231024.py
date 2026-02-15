from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import UserListItem, UserStatusUpdate, UserListResponse
from app.schemas.admin.plan_pricing import (
    TournamentPricingPlanCreate,
    TournamentPricingPlanUpdate,
    TournamentPricingPlanStatusUpdate,
    TournamentPricingPlanResponse
)
from app.schemas.admin.transaction import TransactionResponse, TransactionListResponse, AdminWalletResponse, FinancialStatsResponse
from app.services.admin_service import get_all_users_except_admin, update_user_status
from app.services.admin.plan_pricing import (
    create_tournament_pricing_plan,
    get_all_tournament_pricing_plans,
    get_tournament_pricing_plan_by_id,
    update_tournament_pricing_plan,
    update_tournament_pricing_plan_status
)
from app.services.admin.transaction_service import (
    get_all_transactions, 
    get_transactions_count, 
    get_admin_wallet,
    get_financial_statistics,
    get_transactions_by_date_range
)
from app.services.admin.report_service import generate_financial_report_pdf, calculate_date_range
from app.utils.admin_dependencies import get_current_admin_user
from typing import List, Optional
from app.services.admin.tournament_service import (
    get_all_tournaments,
    get_tournament_by_id,
    update_tournament_block_status
)
from app.schemas.admin.tournament import TournamentListResponse,TournamentBlockUpdate

from app.schemas.organizer.tournament import TournamentResponse
router = APIRouter(prefix="/admin", tags=["admin"])


# User Management Endpoints
@router.get("/users", response_model=UserListResponse)
def list_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    users, total, stats = get_all_users_except_admin(
        db,
        skip=skip,
        limit=limit,
        role_filter=role,
        status_filter=status,
        search=search
    )
    
    return UserListResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit,
        stats=stats
    )


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
   
    wallet = get_admin_wallet(db, current_admin.id)
    return AdminWalletResponse.model_validate(wallet)


@router.get("/transactions", response_model=TransactionListResponse)
def list_all_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    transactions = get_all_transactions(db, skip=skip, limit=limit)
    total = get_transactions_count(db)
    
    transaction_responses = []
    for t in transactions:
        user = t.organizer if t.organizer else t.club_manager
        user_name = None
        user_email = None
        
        if user:
            user_name = getattr(user, 'full_name', None)
            user_email = getattr(user, 'email', None)
        
        transaction_data = {
            "id": t.id,
            "transaction_id": t.transaction_id,
            "transaction_type": t.transaction_type,
            "transaction_direction": t.transaction_direction,
            "amount": t.amount,
            "status": t.status,
            "tournament_id": t.tournament_id,
            "tournament_name": t.tournament.tournament_name if t.tournament else None,
            "tournament_status": t.tournament.status if t.tournament else None,
            "user_name": user_name,
            "user_email": user_email,
            "razorpay_payment_id": t.razorpay_payment_id,
            "razorpay_order_id": t.razorpay_order_id,
            "description": t.description,
            "created_at": t.created_at
        }
        transaction_responses.append(TransactionResponse(**transaction_data))
    
    return TransactionListResponse(
        transactions=transaction_responses,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/financial/stats", response_model=FinancialStatsResponse)
def get_financial_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    stats = get_financial_statistics(db)
    return FinancialStatsResponse(**stats)


@router.get("/financial/report")
def download_financial_report(
    report_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    
    try:
        start_dt, end_dt = calculate_date_range(report_type, start_date, end_date)
        
        transactions = get_transactions_by_date_range(db, start_dt, end_dt)
        stats = get_financial_statistics(db)
        
        pdf_buffer = generate_financial_report_pdf(
            transactions=transactions,
            report_type=report_type,
            start_date=start_dt,
            end_date=end_dt,
            stats=stats
        )
        
        filename = f"financial_report_{report_type}_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



# add this endpoins for tournamnet management

@router.get("/tournaments", response_model=TournamentListResponse)
def list_all_tournaments(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):

    tournaments, total = get_all_tournaments(db, skip=skip, limit=limit)
    
    return TournamentListResponse(
        tournaments=[TournamentResponse.model_validate(t) for t in tournaments],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/tournaments/{tournament_id}", response_model=TournamentResponse)
def get_tournament_details(
    tournament_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):

    tournament = get_tournament_by_id(db, tournament_id)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    return TournamentResponse.model_validate(tournament)

@router.patch("/tournaments/{tournament_id}/block", response_model=TournamentResponse)
def block_unblock_tournament(
    tournament_id: int,
    payload: TournamentBlockUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
  
    tournament = update_tournament_block_status(db, tournament_id, payload.is_blocked)
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    return TournamentResponse.model_validate(tournament)
