"""
Document processing routes.
"""
import asyncio
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from pypdf import PdfReader
from docx import Document
from io import BytesIO
from langchain.text_splitter import RecursiveCharacterTextSplitter

from routes.auth import get_token, get_authenticated_supabase
from services.supabase_service import supabase_service
from services.embedding_service import embedding_service
from services.ai_service import ai_service
from models.schemas import (
    ProcessDocumentRequest, ProcessDocumentResponse,
    DocumentUploadResponse, SuccessResponse
)
from utils.decorators import (
    require_auth, validate_file_size, validate_file_type, 
    handle_unicode_errors, async_timeout
)
from exceptions import DocumentProcessingError, ValidationError
from config import settings

router = APIRouter(prefix="/api", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
@require_auth
@validate_file_size()
@validate_file_type()
@handle_unicode_errors
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    token: str = Depends(get_token),
    user = None  # Added by require_auth decorator
):
    """
    Upload and process a document.
    
    Args:
        background_tasks: FastAPI background tasks
        file: Uploaded file
        token: Authentication token
        
    Returns:
        Upload response with document ID
    """
    try:
        supabase_auth = get_authenticated_supabase(token)
        
        if not supabase_auth:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        # Get user ID
        user_response = supabase_auth.auth.get_user(token)
        user_id = user_response.user.id
        
        # Read file content
        content = await file.read()
        
        # Upload to storage
        file_path = f"{user_id}/{file.filename}"
        extension = file.filename.split('.')[-1].lower()
        content_type = "application/pdf" if extension == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Upload to Supabase storage
        await supabase_service.upload_file_to_storage(
            file_path, content, content_type, supabase_auth
        )
        
        # Extract text
        text = await extract_text_from_file(content, extension)
        
        if not text.strip():
            raise ValidationError("No text extracted from file")
        
        # Insert document record
        response = supabase_auth.table("user_documents").insert({
            "user_id": user_id,
            "file_name": file.filename,
            "file_type": f".{extension}",
            "storage_path": file_path
        }).execute()
        
        if not response.data:
            raise DocumentProcessingError("Failed to insert document record")
        
        document_id = response.data[0]["id"]
        
        # Chunk text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""]
        )
        chunks = text_splitter.split_text(text)
        
        # Insert chunks
        chunk_data = [
            {
                "document_id": document_id,
                "chunk_text": chunk,
                "chunk_index": idx,
                "embedding": None
            } 
            for idx, chunk in enumerate(chunks)
        ]
        
        await supabase_service.insert_document_chunks(chunk_data, supabase_auth)
        
        # Background embeddings
        background_tasks.add_task(
            generate_embeddings_background, 
            document_id, chunks, token
        )
        
        return DocumentUploadResponse(
            success=True,
            message="Document uploaded and processed",
            document_id=document_id,
            file_name=file.filename,
            file_type=f".{extension}"
        )
        
    except Exception as e:
        print(f"[ERROR] Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/process-document", response_model=ProcessDocumentResponse)
@require_auth
@handle_unicode_errors
@async_timeout(60)
async def process_document_endpoint(
    request: ProcessDocumentRequest,
    token: str = Depends(get_token),
    user = None  # Added by require_auth decorator
):
    """
    Process document for AI analysis.
    
    Args:
        request: Process document request
        token: Authentication token
        
    Returns:
        Processing results
    """
    try:
        result = await process_document(
            request.text, 
            request.user_id, 
            request.document_id
        )
        
        if result["success"]:
            return ProcessDocumentResponse(
                success=True,
                message="Document processed successfully",
                chunks_inserted=result["chunks_inserted"],
                total_chunks=result["total_chunks"],
                failed_chunks=result["failed_chunks"],
                processing_time=result["processing_time"],
                document_id=request.document_id
            )
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except Exception as e:
        print(f"[ERROR] Process document error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


async def extract_text_from_file(content: bytes, extension: str) -> str:
    """
    Extract text from uploaded file.
    
    Args:
        content: File content
        extension: File extension
        
    Returns:
        Extracted text
    """
    try:
        if extension == "pdf":
            reader = PdfReader(BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        elif extension == "docx":
            doc = Document(BytesIO(content))
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise ValidationError(f"Unsupported file type: {extension}")
    except Exception as e:
        raise DocumentProcessingError(f"Failed to extract text: {str(e)}")


async def process_document(text: str, user_id: str, document_id: str) -> dict:
    """
    Process document for AI analysis.
    
    Args:
        text: Document text
        user_id: User ID
        document_id: Document ID
        
    Returns:
        Processing results
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Validate inputs
        if not text or not text.strip():
            raise ValidationError("Text content is required and cannot be empty")
        if not user_id:
            raise ValidationError("User ID is required")
        if not document_id:
            raise ValidationError("Document ID is required")
        
        # Initialize text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""]
        )
        
        # Split text into chunks
        chunks = text_splitter.split_text(text)
        
        if not chunks:
            return {
                "success": False,
                "error": "No chunks created from text",
                "chunks_inserted": 0,
                "processing_time": 0
            }
        
        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings(chunks)
        
        # Prepare chunk data
        chunk_data = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_data.append({
                "document_id": document_id,
                "chunk_text": chunk,
                "chunk_index": i,
                "embedding": embedding
            })
        
        # Insert chunks using service role for admin operations
        from supabase import create_client
        supabase_admin = create_client(
            settings.supabase_url, 
            settings.supabase_service_role_key or settings.supabase_anon_key
        )
        
        # Insert in batches
        batch_size = 50
        total_inserted = 0
        failed_chunks = 0
        
        for i in range(0, len(chunk_data), batch_size):
            batch = chunk_data[i:i + batch_size]
            try:
                response = supabase_admin.table("document_chunks").insert(batch).execute()
                if response.data:
                    total_inserted += len(response.data)
            except Exception as e:
                print(f"[ERROR] Failed to insert batch: {e}")
                failed_chunks += len(batch)
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return {
            "success": True,
            "chunks_inserted": total_inserted,
            "total_chunks": len(chunks),
            "failed_chunks": failed_chunks,
            "processing_time": round(processing_time, 2),
            "document_id": document_id,
            "user_id": user_id
        }
        
    except Exception as e:
        error_msg = f"Error processing document {document_id}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "error": error_msg,
            "chunks_inserted": 0,
            "processing_time": 0
        }


async def generate_embeddings_background(document_id: str, chunks: List[str], token: str):
    """
    Generate embeddings for document chunks in the background.
    
    Args:
        document_id: Document ID
        chunks: Text chunks
        token: Authentication token
    """
    try:
        supabase_auth = get_authenticated_supabase(token)
        
        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings(chunks)
        
        # Update chunks with embeddings
        updated_count = 0
        for i in range(len(chunks)):
            try:
                update_response = supabase_auth.table("document_chunks").update(
                    {"embedding": embeddings[i]}
                ).eq("document_id", document_id).eq("chunk_index", i).execute()
                
                if update_response.data:
                    updated_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to update chunk {i}: {e}")
        
        print(f"[DEBUG] Updated {updated_count}/{len(chunks)} chunks with embeddings")
        
    except Exception as e:
        print(f"[ERROR] Background embeddings error: {e}")
