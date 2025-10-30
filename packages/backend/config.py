"""
Configuration management for Contract IQ backend.
"""
import os
from typing import Optional
from pydantic import validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
# Try .env.local first (for local dev), then .env (for Docker/production)
env_local_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
if os.path.exists(env_local_path):
    load_dotenv(dotenv_path=env_local_path)
elif os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()  # Fallback to default .env location

class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Supabase Configuration
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    # API Keys
    openrouter_api_key: Optional[str] = None
    openrouter_api_key_fallback: Optional[str] = None
    
    # Application Settings
    app_name: str = "Contract IQ Backend"
    app_version: str = "0.1.0"
    debug: bool = False
    
    @validator('debug', pre=True)
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ('true', '1', 'yes', 'on')
        return bool(v)
    
    # CORS Settings
    cors_origins: Optional[list] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://contract-iq-light.vercel.app"
    ]
    
    # Model Settings
    embedding_model_name: str = "hash-based"
    
    # Processing Settings
    chunk_size: int = 800
    chunk_overlap: int = 100
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    supported_file_types: list = ['.pdf', '.docx']
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # @validator('supabase_url', 'supabase_anon_key')
    # def validate_required_fields(cls, v):
    #     if not v:
    #         raise ValueError('Required field cannot be empty')
    #     return v
    
    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        if v is None:
            return [
                "http://localhost:3000", 
                "http://127.0.0.1:3000",
                "https://*.vercel.app",
                "https://contract-iq-light.vercel.app"
            ]
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    class Config:
        env_file = [".env.local", ".env"]
        case_sensitive = False

# Global settings instance
settings = Settings()

# Validate critical settings on import
def validate_settings():
    """Validate that all required settings are present."""
    required_fields = ['supabase_url', 'supabase_anon_key']
    missing_fields = []
    
    for field in required_fields:
        if not getattr(settings, field, None):
            missing_fields.append(field)
    
    if missing_fields:
        print(f"Warning: Missing configuration: {', '.join(missing_fields)}")
        print("Please check your .env.local file for required variables.")

# Validate settings on module import
try:
    validate_settings()
except ValueError as e:
    print(f"Configuration error: {e}")
    print("Please check your .env.local file for required variables.")
