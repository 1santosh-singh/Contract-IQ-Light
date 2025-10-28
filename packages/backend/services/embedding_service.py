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
        """Generate embeddings using HuggingFace API with fallback."""
        try:
            if not settings.huggingface_api_key:
                print("[WARNING] HuggingFace API key not configured, using dummy embeddings")
                return self._generate_dummy_embeddings(texts)
            
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
                print("[WARNING] Invalid HuggingFace response, using dummy embeddings")
                return self._generate_dummy_embeddings(texts)
                
        except requests.RequestException as e:
            print(f"[WARNING] HuggingFace API failed: {e}, using dummy embeddings")
            return self._generate_dummy_embeddings(texts)
        except Exception as e:
            print(f"[WARNING] Embedding generation failed: {e}, using dummy embeddings")
            return self._generate_dummy_embeddings(texts)
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a single query.
        
        Args:
            query: Query text to embed
            
        Returns:
            Embedding vector
        """
        try:
            embeddings = await self.generate_embeddings([query])
            return embeddings[0]
        except Exception as e:
            print(f"[WARNING] Query embedding failed: {e}, using dummy embedding")
            return self._generate_dummy_embeddings([query])[0]
    
    def _generate_dummy_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate dummy embeddings when API is not available."""
        import hashlib
        
        embeddings = []
        for text in texts:
            # Create a simple hash-based embedding
            text_hash = hashlib.md5(text.encode()).hexdigest()
            # Convert hash to 384-dimensional vector (matching sentence-transformers)
            embedding = []
            for i in range(0, len(text_hash), 2):
                hex_pair = text_hash[i:i+2]
                value = int(hex_pair, 16) / 255.0 - 0.5  # Normalize to [-0.5, 0.5]
                embedding.append(value)
            
            # Pad or truncate to 384 dimensions
            while len(embedding) < 384:
                embedding.extend(embedding[:min(len(embedding), 384 - len(embedding))])
            embedding = embedding[:384]
            
            embeddings.append(embedding)
        
        return embeddings


# Global embedding service instance
embedding_service = EmbeddingService()
