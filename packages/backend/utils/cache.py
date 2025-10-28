"""
Caching utilities for performance optimization.
"""
import asyncio
import time
from typing import Any, Optional, Dict
from functools import lru_cache, wraps
import json
import hashlib

from config import settings


class SimpleCache:
    """Simple in-memory cache with TTL support."""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if time.time() > entry['expires_at']:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache."""
        if ttl is None:
            ttl = self.default_ttl
        
        self.cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl
        }
    
    def delete(self, key: str) -> None:
        """Delete value from cache."""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
    
    def cleanup_expired(self) -> None:
        """Remove expired entries."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time > entry['expires_at']
        ]
        for key in expired_keys:
            del self.cache[key]


# Global cache instance
cache = SimpleCache()


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from arguments."""
    key_data = {
        'args': args,
        'kwargs': sorted(kwargs.items())
    }
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(ttl: int = 300):
    """
    Decorator for caching function results.
    
    Args:
        ttl: Time to live in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


def cached_sync(ttl: int = 300):
    """
    Decorator for caching synchronous function results.
    
    Args:
        ttl: Time to live in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


# LRU cache for frequently used functions
@lru_cache(maxsize=128)
def get_model_config(model_name: str) -> Dict[str, Any]:
    """Get model configuration (cached)."""
    return {
        "name": model_name,
        "max_tokens": 1000,
        "temperature": 0.1
    }


@lru_cache(maxsize=64)
def get_embedding_config(model_name: str) -> Dict[str, Any]:
    """Get embedding configuration (cached)."""
    return {
        "model": model_name,
        "dimension": 768,
        "batch_size": 8
    }


async def cleanup_cache_periodically():
    """Periodically clean up expired cache entries."""
    while True:
        await asyncio.sleep(60)  # Clean up every minute
        cache.cleanup_expired()


# Cache for embeddings (longer TTL since they don't change)
EMBEDDING_CACHE_TTL = 3600  # 1 hour

def cache_embedding(text: str, embedding: list) -> None:
    """Cache embedding for text."""
    key = f"embedding:{hashlib.md5(text.encode()).hexdigest()}"
    cache.set(key, embedding, EMBEDDING_CACHE_TTL)


def get_cached_embedding(text: str) -> Optional[list]:
    """Get cached embedding for text."""
    key = f"embedding:{hashlib.md5(text.encode()).hexdigest()}"
    return cache.get(key)


# Cache for AI responses (shorter TTL)
AI_RESPONSE_CACHE_TTL = 300  # 5 minutes

def cache_ai_response(prompt: str, response: str) -> None:
    """Cache AI response for prompt."""
    key = f"ai_response:{hashlib.md5(prompt.encode()).hexdigest()}"
    cache.set(key, response, AI_RESPONSE_CACHE_TTL)


def get_cached_ai_response(prompt: str) -> Optional[str]:
    """Get cached AI response for prompt."""
    key = f"ai_response:{hashlib.md5(prompt.encode()).hexdigest()}"
    return cache.get(key)
