from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserRole
from app.schemas.organizer.tournament import TournamentResponse
from app.schemas.clubmanager.enrollment import (
    TournamentEnrollmentCreate, TournamentEnrollmentResponse,
    EnrollmentPaymentRequest
)
from app.services.clubmanager.enrollment import (
    get_eligible_tournaments_for_club_manager,
    initiate_enrollment,
    verify_and_complete_enrollment
)
from app.utils.jwt import get_current_user
from typing import List

router = APIRouter(prefix="/clubmanager", tags=["clubmanager"])

@router.get("/tournaments", response_model=List[TournamentResponse])
def get_eligible_tournaments_endpoint(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get tournaments eligible for club manager enrollment"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can view tournaments"
        )
    
    tournaments = get_eligible_tournaments_for_club_manager(db)
    return tournaments

@router.post("/enroll/initiate", response_model=dict)
def initiate_tournament_enrollment(
    enrollment_data: TournamentEnrollmentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    Initiate tournament enrollment and create payment order"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can enroll in tournaments"
        )
    
    try:
        result = initiate_enrollment(
            db=db,
            tournament_id=enrollment_data.tournament_id,
            club_id=enrollment_data.club_id,
            club_manager_id=current_user.id
        )
        db.commit()
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/enroll/verify", response_model=TournamentEnrollmentResponse)
def verify_enrollment_payment(
    payment_data: EnrollmentPaymentRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Verify payment and complete enrollment"""
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.CLUB_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club managers can verify enrollment"
        )
    
    try:
        enrollment_response = verify_and_complete_enrollment(
            db=db,
            tournament_id=payment_data.tournament_id,
            club_id=payment_data.club_id,
            club_manager_id=current_user.id,
            razorpay_order_id=payment_data.razorpay_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            razorpay_signature=payment_data.razorpay_signature
        )
        db.commit()
        return enrollment_response
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
