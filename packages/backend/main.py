"""
Contract IQ Backend - Refactored Main Application
"""
import asyncio
import sys
import os

# Add the backend directory to the path to enable absolute imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware

from config import settings
from exceptions import ContractIQException, create_http_exception
from services.embedding_service import embedding_service
from services.supabase_service import supabase_service
from middleware.rate_limiter import rate_limit_middleware
from utils.cache import cleanup_cache_periodically

# Import route modules
from routes import auth, documents, chat, analysis, health

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Contract Analysis Platform"
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware_wrapper(request: Request, call_next):
    """Rate limiting middleware wrapper."""
    return await rate_limit_middleware(request, call_next)

# Global exception handler
@app.exception_handler(ContractIQException)
async def custom_exception_handler(request, exc: ContractIQException):
    """Handle custom Contract IQ exceptions."""
    http_exc = create_http_exception(exc)
    return JSONResponse(
        status_code=http_exc.status_code,
        content={"detail": http_exc.detail}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    print("[INFO] Contract IQ Backend starting up...")
    
    # Initialize embedding service
    try:
        success = await embedding_service.initialize_model()
        if success:
            print("[INFO] LegalBERT model loaded successfully")
        else:
            print("[WARNING] LegalBERT model failed to load, will use API fallback")
    except Exception as e:
        print(f"[WARNING] Embedding service initialization failed: {e}")
    
    # Verify Supabase connection
    if supabase_service.client:
        print("[INFO] Supabase client connected")
    else:
        print("[ERROR] Supabase client failed to initialize")
    
    # Start cache cleanup task
    asyncio.create_task(cleanup_cache_periodically())
    print("[INFO] Cache cleanup task started")
    
    print("[INFO] Backend startup complete")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Contract IQ Backend API",
        "version": settings.app_version,
        "status": "running"
    }

# Include route modules
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(analysis.router)
app.include_router(health.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=settings.debug
    )
