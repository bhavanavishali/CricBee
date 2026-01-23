from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.schemas.organizer.tournament import (
    TournamentCreate,
    TournamentResponse,
    PaymentVerification,
    OrganizerTransactionResponse,
    OrganizerWalletBalanceResponse,
    FinanceReportRequest,
    FinanceReportSummaryResponse;
)
from app.schemas.clubmanager.enrollment import EnrolledClubResponse
from app.services.clubmanager.enrollment import get_enrolled_clubs_for_tournament, remove_club_from_tournament_with_refund
from app.services.club_service import get_club_by_id
from app.schemas.club_manager import ClubRead
from app.schemas.user import UserRead
from app.services.organizer.tournament_service import (
    create_tournament_with_payment,
    verify_and_complete_payment,
    get_organizer_tournaments,
    get_organizer_transactions,
    cancel_tournament,
    get_organizer_wallet_balance,
    get_finance_report
)
from app.models.admin.transaction import Transaction
from app.models.admin.plan_pricing import TournamentPricingPlan
from app.schemas.admin.plan_pricing import TournamentPricingPlanResponse
from typing import List
from app.tasks.notification_tasks import send_tournament_cancellation_notification
from pydantic import BaseModel

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
    #Get active pricing plans for tournament creation
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
        # ValueError means a business logic error (validation, missing data, etc.)
        error_msg = str(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except Exception as e:
        # Log the full error for debugging
        import logging
        import traceback
        error_trace = traceback.format_exc()
        error_type = type(e).__name__
        error_message = str(e)
        
        logging.error(f"Error creating tournament - Type: {error_type}, Message: {error_message}")
        logging.error(f"Full traceback:\n{error_trace}")
        
        # Provide more helpful error message based on error type
        if "Razorpay" in error_message or "razorpay" in error_message.lower() or "payment gateway" in error_message.lower():
            error_detail = "Payment gateway error. Please ensure Razorpay credentials are configured correctly."
        elif "database" in error_message.lower() or "sql" in error_message.lower() or "sqlalchemy" in error_type.lower():
            error_detail = "Database error occurred. Please try again or contact support."
        elif "validation" in error_message.lower() or "pydantic" in error_type.lower():
            error_detail = f"Validation error: {error_message}"
        else:
            error_detail = f"Failed to create tournament: {error_message}"
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
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
    cancellation_data: TournamentCancellationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can cancel tournaments"
        )
    
    try:
        tournament = cancel_tournament(db, tournament_id, current_user.id)
        
        # Send notifications using Celery
        send_tournament_cancellation_notification.delay(
            tournament_id=tournament_id,
            title=cancellation_data.notification_title,
            description=cancellation_data.notification_description
        )
        
        return tournament
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
@router.get("/{tournament_id}/enrolled-clubs", response_model=List[EnrolledClubResponse])
def get_enrolled_clubs(
    tournament_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #Get all clubs enrolled in a tournament
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view enrolled clubs"
        )
    
    try:
        enrolled_clubs = get_enrolled_clubs_for_tournament(db, tournament_id, current_user.id)
        return enrolled_clubs
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/clubs/{club_id}/details")
def get_club_details(
    club_id: int,
    request: Request,
    db: Session = Depends(get_db),
    tournament_id: int = Query(None, description="Tournament ID to get Playing XI data")
):
    #Get club details (for organizers viewing enrolled clubs)
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view club details"
        )
    
    club = get_club_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Get club players
    from app.models.club_player import ClubPlayer
    from app.models.player import PlayerProfile
    from app.models.organizer.fixture import PlayingXI, Match
    from sqlalchemy.orm import joinedload
    
    club_players = db.query(ClubPlayer).options(
        joinedload(ClubPlayer.player).joinedload(PlayerProfile.user)
    ).filter(
        ClubPlayer.club_id == club_id
    ).all()
    
    # Get Playing XI data for tournament matches if tournament_id is provided
    playing_xi_data = {}
    if tournament_id:
        # Get all matches for this club in this tournament
        playing_xis = db.query(PlayingXI).options(
            joinedload(PlayingXI.match).joinedload(Match.team_a),
            joinedload(PlayingXI.match).joinedload(Match.team_b)
        ).join(
            Match, PlayingXI.match_id == Match.id
        ).filter(
            PlayingXI.club_id == club_id,
            Match.tournament_id == tournament_id
        ).all()
        
        # Organize by player_id
        for pxi in playing_xis:
            if pxi.player_id not in playing_xi_data:
                playing_xi_data[pxi.player_id] = []
            
            match_info = {
                "match_id": pxi.match_id,
                "match_number": pxi.match.match_number,
                "team_a": pxi.match.team_a.club_name if pxi.match.team_a else "TBD",
                "team_b": pxi.match.team_b.club_name if pxi.match.team_b else "TBD",
                "match_date": pxi.match.match_date.isoformat() if pxi.match.match_date else None,
                "match_status": pxi.match.match_status,
                "is_captain": pxi.is_captain,
                "is_vice_captain": pxi.is_vice_captain
            }
            playing_xi_data[pxi.player_id].append(match_info)
    
    # Format players data
    players_data = []
    for cp in club_players:
        if cp.player and cp.player.user:
            player_info = {
                "id": cp.player.id,
                "full_name": cp.player.user.full_name,
                "email": cp.player.user.email,
                "cricb_id": cp.player.cricb_id,
                "role": "All-rounder",  # PlayerProfile doesn't have batting_style field
                "jersey_number": cp.player.id,  # Use player ID as jersey number for now
                "joined_at": cp.joined_at.isoformat() if cp.joined_at else None,
                "playing_xi_matches": playing_xi_data.get(cp.player.id, []),
                "total_matches_selected": len(playing_xi_data.get(cp.player.id, []))
            }
            players_data.append(player_info)
    
    return {
        "club": ClubRead.model_validate(club),
        "manager": UserRead.model_validate(club.manager),
        "players": players_data,
        "total_players": len(players_data)
    }

@router.delete("/{tournament_id}/enrolled-clubs/{club_id}", response_model=dict)
def remove_club_from_tournament(
    tournament_id: int,
    club_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can remove clubs from tournaments"
        )
    
    try:
        result = remove_club_from_tournament_with_refund(
            db, tournament_id, club_id, current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/finance-report", response_model=FinanceReportSummaryResponse)
def get_finance_report_endpoint(
    report_request: FinanceReportRequest,
    request: Request,
    db: Session = Depends(get_db)
):
   #Get finance report with date filtering for organizer
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can view finance reports"
        )
    
    try:
        report = get_finance_report(
            db=db,
            organizer_id=current_user.id,
            filter_type=report_request.filter_type,
            start_date=report_request.start_date,
            end_date=report_request.end_date
        )
        return FinanceReportSummaryResponse(**report)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )