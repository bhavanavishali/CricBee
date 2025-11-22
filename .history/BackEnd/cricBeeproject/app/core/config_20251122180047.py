from pydantic_settings import BaseSettings
from pydantic import EmailStr


class Settings(BaseSettings):
        DATABASE_URL: str = "sqlite:///./app.db"
        SECRET_KEY: str = "change-me"
        ACCESS_TOKEN_EXPIRE_MIN: int = 30
        ALGORITHM: str = "HS256"

        redis_host: str = "localhost"
        redis_port: int = 6379
        redis_db: int = 0

        smtp_host: str = "smtp.gmail.com"
        smtp_port: int = 587
        smtp_user: str
        smtp_password: str
        smtp_from: str

<<<<<<< HEAD
=======
        aws_access_key_id: str | None = None
        aws_secret_access_key: str | None = None
        aws_s3_region: str | None = None
        aws_s3_bucket: str | None = None
        aws_s3_organization_folder: str = "organizations"

>>>>>>> feature/player

        model_config = {
            "env_file": ".env" }

settings = Settings()
    