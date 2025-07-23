import os
from typing import List

class Settings:
    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Always allow local development
    ]
    
    def __init__(self):
        # Add production frontend URL from environment variable
        frontend_url = os.getenv("FRONTEND_URL")
        if frontend_url:
            self.CORS_ORIGINS.append(frontend_url)
        
        # Allow additional origins from comma-separated env var
        additional_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
        if additional_origins:
            self.CORS_ORIGINS.extend([origin.strip() for origin in additional_origins.split(",")])

settings = Settings()