"""
Authentication routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

from services.supabase_service import supabase_service
from exceptions import AuthenticationError
from utils.decorators import require_auth

router = APIRouter(prefix="/api", tags=["auth"])


async def get_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate authentication token.
    
    Args:
        authorization: Authorization header
        
    Returns:
        Validated token
        
    Raises:
        HTTPException: If token is invalid
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    
    try:
        # Verify token with Supabase
        if not supabase_service.client:
            print("Supabase client not initialized - skipping token validation")
            return token
        
        user_response = supabase_service.client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        return token
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_authenticated_supabase(token: str):
    """
    Get authenticated Supabase client.
    
    Args:
        token: Authentication token
        
    Returns:
        Authenticated Supabase client
    """
    try:
        return supabase_service.get_authenticated_client(token)
    except Exception as e:
        print(f"Failed to get authenticated Supabase client: {e}")
        # Return a mock client for development when Supabase is not configured
        return None
