"""
Common decorators for the Contract IQ backend.
"""
import asyncio
import time
from functools import wraps
from typing import Callable, Any, Optional
from fastapi import HTTPException, status
from supabase import Client

from config import settings
from exceptions import AuthenticationError, RateLimitError


def require_auth(func: Callable) -> Callable:
    """Decorator to require authentication for endpoints."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract token from kwargs or request
        token = kwargs.get('token')
        if not token:
            raise AuthenticationError("Authentication token required")
        
        # Validate token with Supabase
        try:
            from supabase import create_client
            supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
            user_response = supabase.auth.get_user(token)
            
            if not user_response or not user_response.user:
                raise AuthenticationError("Invalid authentication token")
                
            # Add user info to kwargs
            kwargs['user'] = user_response.user
            return await func(*args, **kwargs)
            
        except Exception as e:
            if isinstance(e, AuthenticationError):
                raise
            raise AuthenticationError(f"Authentication failed: {str(e)}")
    
    return wrapper


def rate_limit(requests: int = 100, window: int = 60):
    """Decorator to implement rate limiting."""
    def decorator(func: Callable) -> Callable:
        # Simple in-memory rate limiting (in production, use Redis)
        request_counts = {}
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get client IP or user ID for rate limiting
            client_id = kwargs.get('user_id', 'anonymous')
            current_time = time.time()
            
            # Clean old entries
            request_counts[client_id] = [
                req_time for req_time in request_counts.get(client_id, [])
                if current_time - req_time < window
            ]
            
            # Check rate limit
            if len(request_counts.get(client_id, [])) >= requests:
                raise RateLimitError(f"Rate limit exceeded: {requests} requests per {window} seconds")
            
            # Add current request
            if client_id not in request_counts:
                request_counts[client_id] = []
            request_counts[client_id].append(current_time)
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def handle_unicode_errors(func: Callable) -> Callable:
    """Decorator to handle Unicode encoding errors gracefully."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except UnicodeEncodeError as e:
            # Log the error but return a safe response
            print(f"Unicode encoding error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Character encoding issue. Please try again with different content."
            )
        except UnicodeDecodeError as e:
            print(f"Unicode decoding error in {func.__name__}: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid character encoding in request data."
            )
    
    return wrapper


def validate_file_size(max_size: int = None):
    """Decorator to validate file size."""
    if max_size is None:
        max_size = settings.max_file_size
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if file is in kwargs
            file = kwargs.get('file')
            if file and hasattr(file, 'size'):
                if file.size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File too large. Maximum size: {max_size} bytes"
                    )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def validate_file_type(allowed_types: list = None):
    """Decorator to validate file type."""
    if allowed_types is None:
        allowed_types = settings.supported_file_types
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if file is in kwargs
            file = kwargs.get('file')
            if file and hasattr(file, 'filename'):
                file_extension = '.' + file.filename.split('.')[-1].lower()
                if file_extension not in allowed_types:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unsupported file type. Allowed types: {allowed_types}"
                    )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def async_timeout(seconds: int = 30):
    """Decorator to add timeout to async functions."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail=f"Operation timed out after {seconds} seconds"
                )
        
        return wrapper
    return decorator


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator to retry function on failure."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
                        continue
                    break
            
            # If all retries failed, raise the last exception
            raise last_exception
        
        return wrapper
    return decorator
