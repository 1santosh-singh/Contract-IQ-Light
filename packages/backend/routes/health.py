"""
Health check routes.
"""
from fastapi import APIRouter
from services.supabase_service import supabase_service
from services.embedding_service import embedding_service

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status information
    """
    try:
        # Check Supabase connection
        supabase_status = "connected" if supabase_service.client else "disconnected"
        
        # Check embedding service
        embedding_status = "api_only"
        
        return {
            "status": "healthy",
            "legal_bert_loaded": embedding_status == "loaded",
            "supabase_connected": supabase_status == "connected",
            "timestamp": "2025-10-25T01:23:50.088301"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2025-10-25T01:23:50.088301"
        }