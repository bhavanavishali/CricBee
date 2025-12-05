
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