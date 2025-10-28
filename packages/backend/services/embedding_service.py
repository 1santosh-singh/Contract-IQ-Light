"""
Embedding service for document processing.
"""
import asyncio
import requests
from typing import List, Optional

from config import settings
from exceptions import EmbeddingServiceError


class EmbeddingService:
    """Service for generating document embeddings."""
    
    def __init__(self):
        self._model_loaded = False
    
    async def initialize_model(self) -> bool:
        """Initialize the embedding service (API-only mode)."""
        print("[INFO] Using API-only mode for embeddings")
        return True
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts using HuggingFace API.
        
        Args:
            texts: List of text chunks to embed
            
        Returns:
            List of embedding vectors
            
        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        try:
            return await self._generate_api_embeddings(texts)
        except Exception as e:
            raise EmbeddingServiceError(f"Failed to generate embeddings: {str(e)}")
    

    
    async def _generate_api_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using HuggingFace API."""
        try:
            if not settings.huggingface_api_key:
                raise EmbeddingServiceError("HuggingFace API key not configured")
            
            response = requests.post(
                f"https://api-inference.huggingface.co/models/{settings.fallback_embedding_model}",
                headers={
                    "Authorization": f"Bearer {settings.huggingface_api_key}",
                    "Content-Type": "application/json"
                },
                json={"inputs": texts},
                timeout=30
            )
            response.raise_for_status()
            
            embeddings = response.json()
            if isinstance(embeddings, list) and len(embeddings) > 0:
                return embeddings
            else:
                raise EmbeddingServiceError("Invalid response from HuggingFace API")
                
        except requests.RequestException as e:
            raise EmbeddingServiceError(f"HuggingFace API request failed: {str(e)}")
        except Exception as e:
            raise EmbeddingServiceError(f"API embedding generation failed: {str(e)}")
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a single query.
        
        Args:
            query: Query text to embed
            
        Returns:
            Embedding vector
            
        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        try:
            embeddings = await self.generate_embeddings([query])
            return embeddings[0]
        except Exception as e:
            raise EmbeddingServiceError(f"Failed to generate query embedding: {str(e)}")


# Global embedding service instance
embedding_service = EmbeddingService()
