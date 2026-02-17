from pydantic import BaseModel
from typing import List,Tuple
from app.schemas.organizer.tournament import TournamentResponse

class TournamentListResponse(BaseModel):
    tournaments:List[TournamentResponse]
    total :int
    skip:int
    limit:int


class TournamentBlockUpdate(BaseModel):
    is_blocked :bool

