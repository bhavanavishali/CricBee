from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin.transaction import TransactionResponse, TransactionListResponse, AdminWalletResponse, FinancialStatsResponse
from app.services.admin.transaction_service import (
    get_all_transactions, 
    get_transactions_count, 
    get_admin_wallet,
    get_financial_statistics,
    get_transactions_by_date_range
)
from app.services.admin.report_service import generate_financial_report_pdf, calculate_date_range
from app.utils.admin_dependencies import get_current_admin_user
from typing import Optional

router = APIRouter()


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

