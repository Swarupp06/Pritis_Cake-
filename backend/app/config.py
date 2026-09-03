from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Priti's Cake API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./priticake.db"
    SECRET_KEY: str = "replace_with_a_secure_secret"

    class Config:
        env_file = ".env"

settings = Settings()
