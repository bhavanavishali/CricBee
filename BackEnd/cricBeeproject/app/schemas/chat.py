from pydantic import BaseModel
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str
    match_id: int

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True