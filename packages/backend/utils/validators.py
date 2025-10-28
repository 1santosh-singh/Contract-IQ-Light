"""
Input validation utilities.
"""
import re
from typing import Any, List, Optional
from fastapi import HTTPException, status

from exceptions import ValidationError


def validate_file_size(file_size: int, max_size: int = 10 * 1024 * 1024) -> None:
    """
    Validate file size.
    
    Args:
        file_size: Size of the file in bytes
        max_size: Maximum allowed size in bytes
        
    Raises:
        ValidationError: If file is too large
    """
    if file_size > max_size:
        raise ValidationError(f"File too large. Maximum size: {max_size} bytes")


def validate_file_type(filename: str, allowed_types: List[str] = None) -> None:
    """
    Validate file type.
    
    Args:
        filename: Name of the file
        allowed_types: List of allowed file extensions
        
    Raises:
        ValidationError: If file type is not allowed
    """
    if allowed_types is None:
        allowed_types = ['.pdf', '.docx']
    
    file_extension = '.' + filename.split('.')[-1].lower()
    if file_extension not in allowed_types:
        raise ValidationError(f"Unsupported file type. Allowed types: {allowed_types}")


def validate_text_content(text: str, min_length: int = 1, max_length: int = 1000000) -> str:
    """
    Validate text content.
    
    Args:
        text: Text to validate
        min_length: Minimum text length
        max_length: Maximum text length
        
    Returns:
        Cleaned text
        
    Raises:
        ValidationError: If text is invalid
    """
    if not text or not isinstance(text, str):
        raise ValidationError("Text content is required")
    
    cleaned_text = text.strip()
    
    if len(cleaned_text) < min_length:
        raise ValidationError(f"Text too short. Minimum length: {min_length}")
    
    if len(cleaned_text) > max_length:
        raise ValidationError(f"Text too long. Maximum length: {max_length}")
    
    return cleaned_text


def validate_email(email: str) -> str:
    """
    Validate email format.
    
    Args:
        email: Email to validate
        
    Returns:
        Validated email
        
    Raises:
        ValidationError: If email is invalid
    """
    if not email or not isinstance(email, str):
        raise ValidationError("Email is required")
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format")
    
    return email.lower().strip()


def validate_uuid(uuid_string: str) -> str:
    """
    Validate UUID format.
    
    Args:
        uuid_string: UUID string to validate
        
    Returns:
        Validated UUID
        
    Raises:
        ValidationError: If UUID is invalid
    """
    if not uuid_string or not isinstance(uuid_string, str):
        raise ValidationError("UUID is required")
    
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    if not re.match(uuid_pattern, uuid_string.lower()):
        raise ValidationError("Invalid UUID format")
    
    return uuid_string.lower().strip()


def validate_query_string(query: str) -> str:
    """
    Validate search query string.
    
    Args:
        query: Query string to validate
        
    Returns:
        Cleaned query string
        
    Raises:
        ValidationError: If query is invalid
    """
    if not query or not isinstance(query, str):
        raise ValidationError("Query is required")
    
    cleaned_query = query.strip()
    
    if len(cleaned_query) < 1:
        raise ValidationError("Query cannot be empty")
    
    if len(cleaned_query) > 1000:
        raise ValidationError("Query too long. Maximum length: 1000 characters")
    
    # Check for potentially malicious content
    dangerous_patterns = [
        r'<script',
        r'javascript:',
        r'data:',
        r'vbscript:',
        r'onload=',
        r'onerror=',
        r'onclick='
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, cleaned_query, re.IGNORECASE):
            raise ValidationError("Query contains potentially dangerous content")
    
    return cleaned_query


def sanitize_html(html_content: str) -> str:
    """
    Sanitize HTML content by removing potentially dangerous tags.
    
    Args:
        html_content: HTML content to sanitize
        
    Returns:
        Sanitized HTML content
    """
    if not html_content:
        return ""
    
    # Remove script tags and their content
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove javascript: and other dangerous protocols
    html_content = re.sub(r'javascript:', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'vbscript:', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'data:', '', html_content, flags=re.IGNORECASE)
    
    # Remove dangerous event handlers
    dangerous_attributes = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
        'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload'
    ]
    
    for attr in dangerous_attributes:
        html_content = re.sub(
            rf'{attr}\s*=\s*["\'][^"\']*["\']',
            '',
            html_content,
            flags=re.IGNORECASE
        )
    
    return html_content


def validate_embedding_vector(embedding: List[float], expected_dim: int = 768) -> List[float]:
    """
    Validate embedding vector.
    
    Args:
        embedding: Embedding vector to validate
        expected_dim: Expected dimension of the vector
        
    Returns:
        Validated embedding vector
        
    Raises:
        ValidationError: If embedding is invalid
    """
    if not embedding or not isinstance(embedding, list):
        raise ValidationError("Embedding vector is required")
    
    if len(embedding) != expected_dim:
        raise ValidationError(f"Invalid embedding dimension. Expected: {expected_dim}, got: {len(embedding)}")
    
    # Check if all elements are numbers
    for i, value in enumerate(embedding):
        if not isinstance(value, (int, float)):
            raise ValidationError(f"Invalid embedding value at index {i}: {value}")
        
        # Check for NaN or infinite values
        if not (value == value) or value == float('inf') or value == float('-inf'):
            raise ValidationError(f"Invalid embedding value at index {i}: {value}")
    
    return embedding
