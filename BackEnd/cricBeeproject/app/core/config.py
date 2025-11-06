from pydantic_settings import BaseSettings
from pydantic import EmailStr


class Settings(BaseSettings):
        DATABASE_URL: str = "sqlite:///./app.db"
        SECRET_KEY: str = "change-me"
        ACCESS_TOKEN_EXPIRE_MIN: int = 30
        ALGORITHM: str = "HS256"

        model_config = {
            "env_file": ".env" }

settings = Settings()
    