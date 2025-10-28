"""
Custom exceptions for Contract IQ backend.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class ContractIQException(Exception):
    """Base exception for Contract IQ application."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(ContractIQException):
    """Authentication related errors."""
    pass


class AuthorizationError(ContractIQException):
    """Authorization related errors."""
    pass


class DocumentProcessingError(ContractIQException):
    """Document processing related errors."""
    pass


class EmbeddingServiceError(ContractIQException):
    """Embedding service related errors."""
    pass


class AIServiceError(ContractIQException):
    """AI service related errors."""
    pass


class StorageError(ContractIQException):
    """Storage related errors."""
    pass


class ValidationError(ContractIQException):
    """Input validation errors."""
    pass


class RateLimitError(ContractIQException):
    """Rate limiting errors."""
    pass


# HTTP Exception mappings
def create_http_exception(exc: ContractIQException) -> HTTPException:
    """Convert custom exceptions to HTTP exceptions."""
    
    if isinstance(exc, AuthenticationError):
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message
        )
    elif isinstance(exc, AuthorizationError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=exc.message
        )
    elif isinstance(exc, ValidationError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message
        )
    elif isinstance(exc, RateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=exc.message
        )
    elif isinstance(exc, (DocumentProcessingError, EmbeddingServiceError, AIServiceError, StorageError)):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.message
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
