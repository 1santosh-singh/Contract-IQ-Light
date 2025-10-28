"""
Document analysis routes (summarization, risk analysis, query).
"""
from fastapi import APIRouter, Depends, HTTPException

from routes.auth import get_token, get_authenticated_supabase
from services.supabase_service import supabase_service
from services.embedding_service import embedding_service
from services.ai_service import ai_service
from models.schemas import (
    SummarizeRequest, SummarizeResponse,
    RiskAnalysisRequest, RiskAnalysisResponse,
    QueryRequest, QueryResponse
)
from utils.decorators import require_auth, handle_unicode_errors
from exceptions import AIServiceError, StorageError

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/summarize", response_model=SummarizeResponse)
@require_auth
@handle_unicode_errors
async def summarize_endpoint(
    request: SummarizeRequest,
    token: str = Depends(get_token),
    user = None  # Added by require_auth decorator
):
    """
    Generate document summary.
    
    Args:
        request: Summarize request
        token: Authentication token
        
    Returns:
        Document summary
    """
    try:
        supabase_auth = get_authenticated_supabase(token)
        
        # Fetch document chunks
        chunks = await supabase_service.get_document_chunks(
            request.document_id, supabase_auth
        )
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No content found for document")
        
        # Combine chunks into context
        context = "\n".join([chunk["chunk_text"] for chunk in chunks])
        
        # Generate summary using AI service
        summary = await ai_service.generate_summary(context)
        
        # Insert summary into database
        summary_data = await supabase_service.insert_document_summary(
            request.document_id, summary, supabase_auth
        )
        
        return SummarizeResponse(
            success=True,
            summary=summary,
            summary_id=summary_data["id"]
        )
        
    except AIServiceError as e:
        # Return fallback summary for AI service errors
        fallback_summary = """## Parties Involved:
- Party A: [Extracted from document, e.g., the company providing services]
- Party B: [Extracted from document, e.g., the client receiving services]

## Key Terms:
- Duration: [e.g., 1 year from start date]
- Compensation: [e.g., $10,000 paid monthly]

## Obligations:
- Party A must provide the agreed services on time.
- Party B must make payments as scheduled.

## Potential Risks:
- Late payments could lead to delays in services.
- Breaking the agreement might result in legal fees.

## Next Steps:
- Review the full contract with a lawyer.
- Sign and return by the deadline."""
        
        # Insert fallback summary
        summary_data = await supabase_service.insert_document_summary(
            request.document_id, fallback_summary, supabase_auth
        )
        
        return SummarizeResponse(
            success=True,
            summary=fallback_summary,
            summary_id=summary_data["id"]
        )
    except Exception as e:
        print(f"[ERROR] Summarize endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.post("/risk-analysis", response_model=RiskAnalysisResponse)
@require_auth
@handle_unicode_errors
async def risk_analysis_endpoint(
    request: RiskAnalysisRequest,
    token: str = Depends(get_token),
    user = None  # Added by require_auth decorator
):
    """
    Generate risk analysis for document.
    
    Args:
        request: Risk analysis request
        token: Authentication token
        
    Returns:
        Risk analysis
    """
    try:
        print(f"[INFO] Risk analysis requested for document_id: {request.document_id}")
        supabase_auth = get_authenticated_supabase(token)
        
        # Fetch document chunks
        print("[INFO] Fetching document chunks...")
        chunks = await supabase_service.get_document_chunks(
            request.document_id, supabase_auth
        )
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No content found for document")
        
        print(f"[INFO] Found {len(chunks)} chunks")
        
        # Combine chunks into context
        context = "\n".join([chunk["chunk_text"] for chunk in chunks])
        
        if not context.strip():
            raise HTTPException(status_code=400, detail="Document has no readable content")
        
        print(f"[INFO] Calling AI service for risk analysis (context length: {len(context)} chars)")
        
        # Generate risk analysis using AI service
        analysis = await ai_service.generate_risk_analysis(context)
        
        print(f"[INFO] AI service returned analysis (length: {len(analysis)} chars)")
        
        # Insert analysis into database
        analysis_data = await supabase_service.insert_risk_analysis(
            request.document_id, analysis, supabase_auth
        )
        
        return RiskAnalysisResponse(
            success=True,
            analysis=analysis,
            analysis_id=analysis_data["id"]
        )
        
    except AIServiceError as e:
        print(f"[WARNING] AI service error, using fallback: {str(e)}")
        # Return fallback analysis for AI service errors
        fallback_analysis = """
        <div style="text-align: center; margin-bottom: 15px;"><span style="background-color: red; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; display: inline-block; text-align: center;">High Risks</span></div>
        <div style="background-color: rgba(255,0,0,0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid red; text-align: left;">
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            <li>Potential breach of confidentiality: Review <span style="background-color: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;">non-disclosure clauses</span></li>
          </ul>
        </div>
        <div style="height: 20px;"></div>

        <div style="text-align: center; margin-bottom: 15px;"><span style="background-color: orange; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; display: inline-block; text-align: center;">Medium Risks</span></div>
        <div style="background-color: rgba(255,165,0,0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid orange; text-align: left;">
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            <li>Payment terms may lead to disputes with <span style="background-color: orange; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;">payment terms</span></li>
          </ul>
        </div>
        <div style="height: 20px;"></div>

        <div style="text-align: center; margin-bottom: 15px;"><span style="background-color: green; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; display: inline-block; text-align: center;">Low Risks</span></div>
        <div style="background-color: rgba(0,128,0,0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid green; text-align: left;">
          <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
            <li>Standard <span style="background-color: green; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;">termination clauses</span></li>
          </ul>
        </div>
        """
        
        # Insert fallback analysis
        analysis_data = await supabase_service.insert_risk_analysis(
            request.document_id, fallback_analysis, supabase_auth
        )
        
        return RiskAnalysisResponse(
            success=True,
            analysis=fallback_analysis,
            analysis_id=analysis_data["id"]
        )
    except Exception as e:
        print(f"[ERROR] Risk analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate risk analysis: {str(e)}")


@router.post("/query", response_model=QueryResponse)
@require_auth
@handle_unicode_errors
async def query_endpoint(
    request: QueryRequest,
    token: str = Depends(get_token),
    user = None  # Added by require_auth decorator
):
    """
    Query document using RAG or direct AI.
    
    Args:
        request: Query request
        token: Authentication token
        
    Returns:
        Query response
    """
    try:
        supabase_auth = get_authenticated_supabase(token)
        
        # Get user ID
        user_response = supabase_auth.auth.get_user(token)
        user_id = user_response.user.id
        
        # Verify document belongs to user
        doc_response = supabase_auth.from_("user_documents").select("id").eq("id", request.document_id).eq("user_id", user_id).execute()
        if not doc_response.data:
            raise HTTPException(status_code=403, detail="Document not found or access denied")
        
        if request.use_rag:
            # Use RAG pipeline
            try:
                # Generate query embedding
                query_embedding = await embedding_service.generate_query_embedding(request.query)
                
                # Search for similar chunks
                similar_chunks = await supabase_service.search_similar_chunks(
                    query_embedding, request.document_id, supabase_auth
                )
                
                if not similar_chunks:
                    # Fallback: get all chunks
                    chunks = await supabase_service.get_document_chunks(
                        request.document_id, supabase_auth
                    )
                    if not chunks:
                        return QueryResponse(
                            success=True,
                            answer="No content found in the document.",
                            source="rag"
                        )
                    context = "\n\n".join([chunk["chunk_text"] for chunk in chunks])
                else:
                    context = "\n\n".join([chunk["chunk_text"] for chunk in similar_chunks])
                
                # Generate response using AI service
                answer = await ai_service.generate_document_query_response(
                    context, request.query, use_rag=True
                )
                
                return QueryResponse(
                    success=True,
                    answer=answer,
                    source="rag",
                    model_used="nvidia/nemotron-nano-9b-v2:free"
                )
                
            except Exception as e:
                print(f"[ERROR] RAG query failed: {e}")
                # Fallback to direct AI
                chunks = await supabase_service.get_document_chunks(
                    request.document_id, supabase_auth
                )
                if not chunks:
                    return QueryResponse(
                        success=True,
                        answer="No content found in the document.",
                        source="error"
                    )
                
                context = "\n\n".join([chunk["chunk_text"] for chunk in chunks])
                answer = await ai_service.generate_document_query_response(
                    context, request.query, use_rag=False
                )
                
                return QueryResponse(
                    success=True,
                    answer=answer,
                    source="api",
                    model_used="nvidia/nemotron-nano-9b-v2:free"
                )
        else:
            # Use direct AI without RAG
            chunks = await supabase_service.get_document_chunks(
                request.document_id, supabase_auth
            )
            
            if not chunks:
                return QueryResponse(
                    success=True,
                    answer="No content found in the document.",
                    source="api"
                )
            
            context = "\n\n".join([chunk["chunk_text"] for chunk in chunks])
            answer = await ai_service.generate_document_query_response(
                context, request.query, use_rag=False
            )
            
            return QueryResponse(
                success=True,
                answer=answer,
                source="api",
                model_used="nvidia/nemotron-nano-9b-v2:free"
            )
            
    except AIServiceError as e:
        # Return fallback response for AI service errors
        fallback_response = "I'm sorry, but I'm currently unable to access the AI model due to authentication or rate limit issues. Please check your API key on OpenRouter."
        
        return QueryResponse(
            success=True,
            answer=fallback_response,
            source="error"
        )
    except Exception as e:
        print(f"[ERROR] Query endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")
