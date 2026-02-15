from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.organizer.tournament import Tournament
from typing import List, Tuple, Optional

def get_all_tournaments(db: Session,
                        skip: int = 0,
                        limit: int = 50
                        ) -> Tuple[List[Tournament], int]:
    tournaments = (
        db.query(Tournament).options(
            joinedload(Tournament.details),
            joinedload(Tournament.payment),
            joinedload(Tournament.plan),
            joinedload(Tournament.organizer),
            joinedload(Tournament.winner_team)
        )
        .order_by(Tournament.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(func.count(Tournament.id)).scalar()
    return tournaments, total

def get_tournament_by_id(db: Session,
                         tournament_id: int) -> Optional[Tournament]:
    return (
        db.query(Tournament)
        .options(
            joinedload(Tournament.details),
            joinedload(Tournament.payment),
            joinedload(Tournament.plan),
            joinedload(Tournament.organizer),
            joinedload(Tournament.winner_team)
        )
        .filter(Tournament.id == tournament_id)
        .first()
    )

def update_tournament_block_status(db: Session,
                                   tournament_id: int,
                                   is_blocked: bool) -> Optional[Tournament]:
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return None
    tournament.is_blocked = is_blocked
    db.commit()
    db.refresh(tournament)

    return get_tournament_by_id(db, tournament_id)

