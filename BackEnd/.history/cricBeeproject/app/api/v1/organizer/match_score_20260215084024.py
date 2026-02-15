from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.user import UserRole
from app.utils.jwt import get_current_user
from app.core.websocket_manager import manager
from app.schemas.organizer.match_score import (
    TossUpdate,
    TossResponse,
    UpdateScoreRequest,
    LiveScoreboardResponse,
    EndInningsRequest,
    ChangeStrikerRequest,
    SelectBowlerRequest,
    SelectNewBatsmanRequest,
    AvailablePlayerResponse,
    SetBatsmenRequest
)
from app.services.organizer.match_score_service import (
    update_toss,
    start_match,
    update_score,
    get_live_scoreboard,
    end_innings,
    get_available_batsmen,
    get_available_bowlers,
    validate_bowler_selection,
    set_opening_batsmen,
    set_initial_bowler,
    get_match_winner,
    complete_match
)
from app.models.organizer.fixture import Match
from app.models.organizer.tournament import Tournament

router = APIRouter(prefix="/matches", tags=["match-score"])

@router.post("/{match_id}/toss", response_model=TossResponse, status_code=status.HTTP_200_OK)
def update_toss_endpoint(
    match_id: int,
    toss_data: TossUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update toss"
        )
    
    try:
        match = update_toss(db, match_id, current_user.id, toss_data)
        
        # Build response
        return TossResponse(
            toss_winner_id=match.toss_winner_id,
            toss_winner_name=match.toss_winner.club_name if match.toss_winner else None,
            toss_decision=match.toss_decision,
            batting_team_id=match.batting_team_id,
            batting_team_name=match.batting_team.club_name if match.batting_team else None,
            bowling_team_id=match.bowling_team_id,
            bowling_team_name=match.bowling_team.club_name if match.bowling_team else None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/start", status_code=status.HTTP_200_OK)
def start_match_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can start matches"
        )
    
    try:
        match = start_match(db, match_id, current_user.id)
        
        
        try:
            import asyncio
            asyncio.create_task(
                manager.broadcast_to_match({
                    "type": "match_started",
                    "match_id": match_id,
                    "match_status": match.match_status
                }, match_id)
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")
        
        return {
            "message": "Match started successfully",
            "match_id": match.id,
            "match_status": match.match_status
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/score", status_code=status.HTTP_200_OK)
def update_score_endpoint(
    match_id: int,
    score_data: UpdateScoreRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can update scores"
        )
    
    try:
        ball_record = update_score(db, match_id, current_user.id, score_data)
        return {
            "message": "Score updated successfully",
            "ball_id": ball_record.id,
            "over": ball_record.over_number,
            "ball": ball_record.ball_number
        }
    except ValueError as e:
        import traceback
        traceback.print_exc()  
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()  
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{match_id}/scoreboard", response_model=LiveScoreboardResponse)
def get_scoreboard_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    #
    current_user = get_current_user(request, db)
    
    try:
        scoreboard = get_live_scoreboard(db, match_id)
        return scoreboard
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        
        import traceback
        print(f"Error in get_scoreboard_endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{match_id}/winner", status_code=status.HTTP_200_OK)
def get_match_winner_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get match winner (public endpoint)"""
    try:
        result = get_match_winner(db, match_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{match_id}/end-innings", status_code=status.HTTP_200_OK)
def end_innings_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can end innings"
        )
    
    try:
        match = end_innings(db, match_id, current_user.id)
        
       
        try:
            import asyncio
            from app.services.organizer.match_score_service import get_live_scoreboard
            
            
            updated_scoreboard = get_live_scoreboard(db, match_id)
            
            asyncio.create_task(
                manager.broadcast_to_match({
                    "type": "innings_ended",
                    "match_id": match_id,
                    "match_status": match.match_status,
                    "scoreboard": updated_scoreboard.dict()
                }, match_id)
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")
        
        return {
            "message": "Innings ended successfully",
            "match_id": match.id,
            "match_status": match.match_status
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{match_id}/available-batsmen", response_model=List[AvailablePlayerResponse])
def get_available_batsmen_endpoint(
    match_id: int,
    request: Request,
    team_id: int = Query(..., description="Team ID"),
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role not in [UserRole.ORGANIZER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        batsmen = get_available_batsmen(db, match_id, team_id)
        
        # If no PlayerMatchStats exist yet, get from Playing XI
        if not batsmen:
            from app.models.organizer.fixture import PlayingXI
            from sqlalchemy.orm import joinedload
            from app.models.player import PlayerProfile
            playing_xi = db.query(PlayingXI).options(
                joinedload(PlayingXI.player).joinedload(PlayerProfile.user)
            ).filter(
                PlayingXI.match_id == match_id,
                PlayingXI.club_id == team_id
            ).all()
            
            return [
                AvailablePlayerResponse(
                    player_id=pxi.player_id,
                    player_name=pxi.player.user.full_name if pxi.player and pxi.player.user else "Unknown",
                    team_id=pxi.club_id
                )
                for pxi in playing_xi
            ]
        
        return [
            AvailablePlayerResponse(
                player_id=stat.player_id,
                player_name=stat.player.user.full_name if stat.player and stat.player.user else "Unknown",
                team_id=stat.team_id
            )
            for stat in batsmen
        ]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{match_id}/available-bowlers", response_model=List[AvailablePlayerResponse])
def get_available_bowlers_endpoint(
    match_id: int,
    request: Request,
    team_id: int = Query(..., description="Team ID"),
    exclude_bowler_id: Optional[int] = Query(None, description="Bowler ID to exclude"),
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role not in [UserRole.ORGANIZER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        bowlers = get_available_bowlers(db, match_id, team_id, exclude_bowler_id)
        
        
        if not bowlers:
            from app.models.organizer.fixture import PlayingXI
            from sqlalchemy.orm import joinedload
            from app.models.player import PlayerProfile
            query = db.query(PlayingXI).options(
                joinedload(PlayingXI.player).joinedload(PlayerProfile.user)
            ).filter(
                PlayingXI.match_id == match_id,
                PlayingXI.club_id == team_id
            )
            
            if exclude_bowler_id:
                query = query.filter(PlayingXI.player_id != exclude_bowler_id)
            
            playing_xi = query.all()
            
            return [
                AvailablePlayerResponse(
                    player_id=pxi.player_id,
                    player_name=pxi.player.user.full_name if pxi.player and pxi.player.user else "Unknown",
                    team_id=pxi.club_id
                )
                for pxi in playing_xi
            ]
        
        return [
            AvailablePlayerResponse(
                player_id=stat.player_id,
                player_name=stat.player.user.full_name if stat.player and stat.player.user else "Unknown",
                team_id=stat.team_id
            )
            for stat in bowlers
        ]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/validate-bowler", status_code=status.HTTP_200_OK)
def validate_bowler_endpoint(
    match_id: int,
    request: Request,
    bowler_id: int = Query(..., description="Bowler ID to validate"),
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role not in [UserRole.ORGANIZER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        result = validate_bowler_selection(db, match_id, bowler_id)
        return result  # Already returns dict with valid and message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/set-batsmen", status_code=status.HTTP_200_OK)
def set_batsmen_endpoint(
    match_id: int,
    request: Request,
    batsmen_data: SetBatsmenRequest,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can set batsmen"
        )
    
    try:
        result = set_opening_batsmen(
            db, 
            match_id, 
            current_user.id, 
            batsmen_data.striker_id, 
            batsmen_data.non_striker_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/set-bowler", status_code=status.HTTP_200_OK)
def set_bowler_endpoint(
    match_id: int,
    request: Request,
    bowler_data: SelectBowlerRequest,
    db: Session = Depends(get_db)
):
   
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can set bowler"
        )
    
    try:
        result = set_initial_bowler(
            db, 
            match_id, 
            current_user.id, 
            bowler_data.bowler_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{match_id}/complete", status_code=status.HTTP_200_OK)
def complete_match_endpoint(
    match_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    
    current_user = get_current_user(request, db)
    if current_user.role != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can complete matches"
        )
    
    try:
        result = complete_match(db, match_id, current_user.id)
        
        
        try:
            import asyncio
            from app.services.organizer.match_score_service import get_live_scoreboard
            
            # Get final scoreboard
            final_scoreboard = get_live_scoreboard(db, match_id)
            
            asyncio.create_task(
                manager.broadcast_to_match({
                    "type": "match_completed",
                    "match_id": match_id,
                    "result": result,
                    "scoreboard": final_scoreboard.dict()
                }, match_id)
            )
        except Exception as e:
            print(f"WebSocket broadcast error: {e}")
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.websocket("/{match_id}/ws")
async def websocket_endpoint(websocket: WebSocket, match_id: int):
    """
    WebSocket endpoint for real-time score updates
    """
    await manager.connect(websocket, match_id)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back or handle any client messages if needed
            await manager.send_personal_message({"type": "echo", "message": data}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id)





