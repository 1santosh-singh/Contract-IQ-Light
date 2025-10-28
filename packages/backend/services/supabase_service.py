"""
Supabase service for database operations.
"""
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from fastapi import HTTPException, status

from config import settings
from exceptions import StorageError, AuthenticationError


class SupabaseService:
    """Service for Supabase database operations."""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Supabase client."""
        try:
            self.client = create_client(settings.supabase_url, settings.supabase_anon_key)
            print(f"[DEBUG] Supabase client initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Supabase client: {e}")
            self.client = None
    
    def get_authenticated_client(self, token: str) -> Client:
        """
        Get authenticated Supabase client.
        
        Args:
            token: User authentication token
            
        Returns:
            Authenticated Supabase client
            
        Raises:
            AuthenticationError: If authentication fails
        """
        try:
            client = create_client(settings.supabase_url, settings.supabase_anon_key)
            client.auth.set_session(access_token=token, refresh_token="")
            return client
        except Exception as e:
            raise AuthenticationError(f"Failed to create authenticated client: {str(e)}")
    
    async def get_user_documents(self, user_id: str, client: Client) -> List[Dict[str, Any]]:
        """
        Get user documents.
        
        Args:
            user_id: User ID
            client: Authenticated Supabase client
            
        Returns:
            List of user documents
        """
        try:
            response = client.from_("user_documents").select("*").eq("user_id", user_id).execute()
            return response.data or []
        except Exception as e:
            raise StorageError(f"Failed to fetch user documents: {str(e)}")
    
    async def get_document_chunks(self, document_id: str, client: Client) -> List[Dict[str, Any]]:
        """
        Get document chunks.
        
        Args:
            document_id: Document ID
            client: Authenticated Supabase client
            
        Returns:
            List of document chunks
        """
        try:
            response = client.from_("document_chunks").select("*").eq("document_id", document_id).order("chunk_index").execute()
            return response.data or []
        except Exception as e:
            raise StorageError(f"Failed to fetch document chunks: {str(e)}")
    
    async def insert_document_chunks(self, chunks: List[Dict[str, Any]], client: Client) -> List[Dict[str, Any]]:
        """
        Insert document chunks.
        
        Args:
            chunks: List of chunk data
            client: Authenticated Supabase client
            
        Returns:
            Inserted chunks data
        """
        try:
            # Insert in batches to avoid payload size limits
            batch_size = 50
            all_inserted = []
            
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                response = client.table("document_chunks").insert(batch).execute()
                if response.data:
                    all_inserted.extend(response.data)
            
            return all_inserted
        except Exception as e:
            raise StorageError(f"Failed to insert document chunks: {str(e)}")
    
    async def search_similar_chunks(
        self, 
        query_embedding: List[float], 
        document_id: str, 
        client: Client,
        match_threshold: float = 0.3,
        match_count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using RAG.
        
        Args:
            query_embedding: Query embedding vector
            document_id: Document ID to search within
            client: Authenticated Supabase client
            match_threshold: Similarity threshold
            match_count: Maximum number of results
            
        Returns:
            List of similar chunks
        """
        try:
            response = client.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_threshold": match_threshold,
                "match_count": match_count,
                "document_id": document_id
            }).execute()
            
            return response.data or []
        except Exception as e:
            print(f"[WARNING] RAG search failed: {e}")
            # Fallback: get all chunks for the document
            return await self.get_document_chunks(document_id, client)
    
    async def insert_document_summary(self, document_id: str, summary: str, client: Client) -> Dict[str, Any]:
        """
        Insert document summary.
        
        Args:
            document_id: Document ID
            summary: Summary text
            client: Authenticated Supabase client
            
        Returns:
            Inserted summary data
        """
        try:
            response = client.table("document_summaries").insert({
                "document_id": document_id,
                "summary": summary
            }).execute()
            
            if not response.data:
                raise StorageError("Failed to insert document summary")
            
            return response.data[0]
        except Exception as e:
            raise StorageError(f"Failed to insert document summary: {str(e)}")
    
    async def insert_risk_analysis(self, document_id: str, analysis: str, client: Client) -> Dict[str, Any]:
        """
        Insert risk analysis.
        
        Args:
            document_id: Document ID
            analysis: Analysis text
            client: Authenticated Supabase client
            
        Returns:
            Inserted analysis data
        """
        try:
            response = client.table("document_risk_analyses").insert({
                "document_id": document_id,
                "analysis": analysis
            }).execute()
            
            if not response.data:
                raise StorageError("Failed to insert risk analysis")
            
            return response.data[0]
        except Exception as e:
            raise StorageError(f"Failed to insert risk analysis: {str(e)}")
    
    async def delete_user_documents(self, user_id: str, client: Client) -> Dict[str, Any]:
        """
        Delete all user documents and related data.
        
        Args:
            user_id: User ID
            client: Authenticated Supabase client
            
        Returns:
            Deletion results
        """
        try:
            # Get user documents first
            documents = await self.get_user_documents(user_id, client)
            document_ids = [doc["id"] for doc in documents]
            
            if not document_ids:
                return {"documents_deleted": 0, "message": "No documents to delete"}
            
            # Delete related data
            deletion_results = {}
            
            # Delete summaries
            try:
                summary_response = client.table("document_summaries").delete().in_("document_id", document_ids).execute()
                deletion_results["summaries_deleted"] = len(summary_response.data) if summary_response.data else 0
            except Exception as e:
                print(f"[WARNING] Failed to delete summaries: {e}")
                deletion_results["summaries_deleted"] = 0
            
            # Delete risk analyses
            try:
                risk_response = client.table("document_risk_analyses").delete().in_("document_id", document_ids).execute()
                deletion_results["risk_analyses_deleted"] = len(risk_response.data) if risk_response.data else 0
            except Exception as e:
                print(f"[WARNING] Failed to delete risk analyses: {e}")
                deletion_results["risk_analyses_deleted"] = 0
            
            # Delete chunks
            try:
                chunks_response = client.table("document_chunks").delete().in_("document_id", document_ids).execute()
                deletion_results["chunks_deleted"] = len(chunks_response.data) if chunks_response.data else 0
            except Exception as e:
                print(f"[WARNING] Failed to delete chunks: {e}")
                deletion_results["chunks_deleted"] = 0
            
            # Delete documents
            try:
                documents_response = client.table("user_documents").delete().eq("user_id", user_id).execute()
                deletion_results["documents_deleted"] = len(documents_response.data) if documents_response.data else 0
            except Exception as e:
                raise StorageError(f"Failed to delete user documents: {str(e)}")
            
            return deletion_results
            
        except Exception as e:
            raise StorageError(f"Failed to delete user documents: {str(e)}")
    
    async def upload_file_to_storage(
        self, 
        file_path: str, 
        content: bytes, 
        content_type: str, 
        client: Client
    ) -> Dict[str, Any]:
        """
        Upload file to Supabase storage.
        
        Args:
            file_path: Storage path
            content: File content
            content_type: MIME type
            client: Authenticated Supabase client
            
        Returns:
            Upload response
        """
        try:
            response = client.storage.from_("contract_iq").upload(
                file_path, 
                content, 
                {"content-type": content_type}
            )
            
            if response is None:
                raise StorageError("Storage upload failed: No response from Supabase")
            
            return {"success": True, "path": file_path}
        except Exception as e:
            raise StorageError(f"Failed to upload file to storage: {str(e)}")
    
    async def delete_file_from_storage(self, file_path: str, client: Client) -> bool:
        """
        Delete file from Supabase storage.
        
        Args:
            file_path: Storage path
            client: Authenticated Supabase client
            
        Returns:
            Success status
        """
        try:
            response = client.storage.from_("contract_iq").remove([file_path])
            return True
        except Exception as e:
            print(f"[WARNING] Failed to delete storage file {file_path}: {e}")
            return False


# Global Supabase service instance
supabase_service = SupabaseService()
