from sqlalchemy.orm import Session, joinedload
from app.models.organizer.fixture import Match, PlayingXI
from app.models.organizer.tournament import TournamentEnrollment
from app.models.club import Club
from app.models.club_player import ClubPlayer
from typing import List, Optional

def get_club_manager_matches(
    db: Session,
    club_id: int,
    manager_id: int
) -> List[Match]:
#    ------ get to all published matches for tournaments where the club is enrolled.
    
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    

    enrollments = db.query(TournamentEnrollment).filter(
        TournamentEnrollment.club_id == club_id,
        TournamentEnrollment.payment_status == "success"
    ).all()
    
    tournament_ids = [enrollment.tournament_id for enrollment in enrollments]
    
    if not tournament_ids:
        return []
    
    # Get all published matches where club is either team_a or team_b
    matches = db.query(Match).options(
        joinedload(Match.team_a),
        joinedload(Match.team_b),
        joinedload(Match.round),
        joinedload(Match.tournament)
    ).filter(
        Match.tournament_id.in_(tournament_ids),
        Match.is_fixture_published == True,
        (Match.team_a_id == club_id) | (Match.team_b_id == club_id)
    ).order_by(Match.match_date.asc(), Match.match_time.asc()).all()
    
    return matches

def get_club_players_for_match(
    db: Session,
    club_id: int,
    manager_id: int
) -> List[ClubPlayer]:
    # -------- get all players in a club (for Playing XI selection)
    
    
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
    # Get all players in the club
    from app.models.player import PlayerProfile
    club_players = db.query(ClubPlayer).options(
        joinedload(ClubPlayer.player).joinedload(PlayerProfile.user)
    ).filter(
        ClubPlayer.club_id == club_id
    ).all()
    
    return club_players

def set_playing_xi(
    db: Session,
    match_id: int,
    club_id: int,
    manager_id: int,
    player_ids: List[int],
    captain_id: Optional[int] = None,
    vice_captain_id: Optional[int] = None
) -> List[PlayingXI]:
    # ------------ Set Playing 11 for a match.
    club = db.query(Club).filter(
        Club.id == club_id,
        Club.manager_id == manager_id
    ).first()
    
    if not club:
        raise ValueError("Club not found or access denied")
    
    
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("match not found")
    
    if match.team_a_id != club_id and match.team_b_id != club_id:
        raise ValueError("Club is not part of this match")
    
    
    club_players = db.query(ClubPlayer).filter(
        ClubPlayer.club_id == club_id,
        ClubPlayer.player_id.in_(player_ids)
    ).all()
    
    if len(club_players) != len(player_ids):
        raise ValueError("One or more players do not belong to this club")
    
   
    if captain_id and captain_id not in player_ids:
        raise ValueError("Captain must be in the selected players")
    
    if vice_captain_id and vice_captain_id not in player_ids:
        raise ValueError("Vice-captain must be in the selected players")
    
    if captain_id and vice_captain_id and captain_id == vice_captain_id:
        raise ValueError("Captain and vice-captain cannot be the same player")
    
   
    db.query(PlayingXI).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.club_id == club_id
    ).delete()
    # Removes old selection (so no duplicates)
   
    playing_xi_list = []
    for player_id in player_ids:
        playing_xi = PlayingXI(
            match_id=match_id,
            club_id=club_id,
            player_id=player_id,
            is_captain=(player_id == captain_id) if captain_id else False,
            is_vice_captain=(player_id == vice_captain_id) if vice_captain_id else False
        )
        db.add(playing_xi)
        playing_xi_list.append(playing_xi)
    
    db.commit()
    
    for pxi in playing_xi_list:
        db.refresh(pxi)
    
    return playing_xi_list

def get_playing_xi(
    db: Session,
    match_id: int,
    club_id: int
) -> List[PlayingXI]:

    from app.models.player import PlayerProfile
    return db.query(PlayingXI).options(
        joinedload(PlayingXI.player).joinedload(PlayerProfile.user)
    ).filter(
        PlayingXI.match_id == match_id,
        PlayingXI.club_id == club_id
    ).all()

