"""
Embedding service for document processing.
"""
import hashlib
from typing import List

from exceptions import EmbeddingServiceError


class EmbeddingService:
    """Service for generating document embeddings using hash-based approach."""
    
    def __init__(self):
        print("[INFO] Using hash-based embeddings")
    
    async def initialize_model(self) -> bool:
        """Initialize the embedding service."""
        return True
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate hash-based embeddings for texts."""
        return self._generate_hash_embeddings(texts)
    
    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a single query."""
        return self._generate_hash_embeddings([query])[0]
    
    def _generate_hash_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate hash-based embeddings."""
        embeddings = []
        for text in texts:
            text_hash = hashlib.md5(text.encode()).hexdigest()
            embedding = []
            for i in range(0, len(text_hash), 2):
                hex_pair = text_hash[i:i+2]
                value = int(hex_pair, 16) / 255.0 - 0.5
                embedding.append(value)
            
            while len(embedding) < 384:
                embedding.extend(embedding[:min(len(embedding), 384 - len(embedding))])
            embedding = embedding[:384]
            embeddings.append(embedding)
        
        return embeddings


embedding_service = EmbeddingService()
