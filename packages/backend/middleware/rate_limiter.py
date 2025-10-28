"""
Rate limiting middleware for FastAPI.
"""
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from collections import defaultdict, deque

from config import settings
from exceptions import RateLimitError


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.cleanup_interval = 60  # Clean up old entries every 60 seconds
        self.last_cleanup = time.time()
    
    def is_allowed(self, client_id: str, limit: int, window: int) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            client_id: Unique identifier for client
            limit: Maximum number of requests
            window: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        current_time = time.time()
        
        # Clean up old entries periodically
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries(current_time, window)
            self.last_cleanup = current_time
        
        # Get client's request history
        client_requests = self.requests[client_id]
        
        # Remove requests outside the window
        cutoff_time = current_time - window
        while client_requests and client_requests[0] < cutoff_time:
            client_requests.popleft()
        
        # Check if under limit
        if len(client_requests) >= limit:
            return False
        
        # Add current request
        client_requests.append(current_time)
        return True
    
    def _cleanup_old_entries(self, current_time: float, window: int):
        """Clean up old entries to prevent memory leaks."""
        cutoff_time = current_time - window
        for client_id in list(self.requests.keys()):
            client_requests = self.requests[client_id]
            while client_requests and client_requests[0] < cutoff_time:
                client_requests.popleft()
            
            # Remove empty entries
            if not client_requests:
                del self.requests[client_id]


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_id(request: Request) -> str:
    """
    Get client identifier for rate limiting.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client identifier
    """
    # Try to get user ID from token if available
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Use token as client ID for authenticated users
        return auth_header
    
    # Fallback to IP address
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    return request.client.host if request.client else "unknown"


async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware/handler
        
    Returns:
        Response or raises HTTPException
    """
    client_id = get_client_id(request)
    
    # Apply rate limiting
    if not rate_limiter.is_allowed(
        client_id=client_id,
        limit=settings.rate_limit_requests,
        window=settings.rate_limit_window
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {settings.rate_limit_requests} requests per {settings.rate_limit_window} seconds"
        )
    
    return await call_next(request)
