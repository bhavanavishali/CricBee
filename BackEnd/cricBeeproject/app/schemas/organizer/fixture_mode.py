from pydantic import BaseModel

class FixtureModeResponse(BaseModel):
    id: int
    mode_name: str
    
    class Config:
        from_attributes = True

class SetFixtureModeRequest(BaseModel):
    fixture_mode_id: int
