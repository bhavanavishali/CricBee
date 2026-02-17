from sqlalchemy.orm import Session
from app.models.chat import ChatMessage
from typing import List

def create_chat_message(
    db: Session,
    user_id: int,
    match_id: int,
    message: str
) -> ChatMessage:
    chat_message = ChatMessage(
        user_id=user_id,
        match_id=match_id,
        message=message
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message

def get_chat_messages(db: Session, match_id: int, limit: int = 100) -> List[ChatMessage]:
    return db.query(ChatMessage)\
        .filter(ChatMessage.match_id == match_id)\
        .order_by(ChatMessage.created_at.desc())\
        .limit(limit)\
        .all()

def format_chat_message_for_response(chat_message: ChatMessage) -> dict:
    return {
        "id": chat_message.id,
        "user_id": chat_message.user_id,
        "user_name": chat_message.user.full_name,
        "message": chat_message.message,
        "created_at": chat_message.created_at.isoformat()
    }