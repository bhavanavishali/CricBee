from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationCreate(BaseModel):
    title: str
    description: str
    recipient_type: str
    recipient_id: Optional[int] = None
    tournament_id: Optional[int] = None

class NotificationResponse(BaseModel):
    id: int
    title: str
    description: str
    recipient_type: str
    recipient_id: Optional[int]
    tournament_id: Optional[int]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int