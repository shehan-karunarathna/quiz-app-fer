from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr
import certifi

class Settings(BaseSettings):
    MONGODB_URI: SecretStr = Field(
        default=...,
        env="MONGODB_URI"
    )
    DATABASE_NAME: str = Field(..., env="DATABASE_NAME")
  
    MODEL_PATH: str = Field(..., env="MODEL_PATH")
    STORAGE_PATH: str = Field(..., env="STORAGE_PATH")
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()