from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.utils.admin_dependencies import get_current_user
from app.services.chat_services import (
    create_chat_message,
    get_chat_messages,
    format_chat_message_for_response
)
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.core.websocket_manager import manager
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/messages/{match_id}", response_model=List[ChatMessageResponse])
def get_messages(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = get_chat_messages(db, match_id)
    return [format_chat_message_for_response(msg) for msg in reversed(messages)]


@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    chat_message = create_chat_message(
        db=db,
        user_id=current_user.id,
        match_id=payload.match_id,
        message=payload.message
    )
    
    message_data = format_chat_message_for_response(chat_message)
    await manager.broadcast_to_match(message_data, payload.match_id)
    return message_data


@router.websocket("/ws/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: int, db: Session = Depends(get_db)):
    
    token = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("access_token")
    
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    
    
    from app.utils.jwt import verify_token, JWTError
    try:
        payload = verify_token(token, token_type="access")
        user_id = int(payload.get("sub"))
        
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            await websocket.close(code=1008, reason="Invalid or inactive user")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    
    await manager.connect(websocket, match_id)
    
    try:
        
        recent_messages = get_chat_messages(db, match_id, limit=50)
        for msg in reversed(recent_messages):
            message_data = format_chat_message_for_response(msg)
            await websocket.send_json(message_data)
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            message_text = data.get("message", "").strip()
            if not message_text:
                continue
            
            # Create chat message
            chat_message = create_chat_message(
                db=db,
                user_id=user.id,
                match_id=match_id,
                message=message_text
            )
            
           
            message_data = format_chat_message_for_response(chat_message)
            await manager.broadcast_to_match(message_data, match_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, match_id)