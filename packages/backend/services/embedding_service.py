"""
Embedding service for document processing.
"""
import asyncio
import requests
import torch
import numpy as np
from typing import List, Optional
from transformers import AutoModel, AutoTokenizer
from concurrent.futures import ThreadPoolExecutor

from config import settings
from exceptions import EmbeddingServiceError


class EmbeddingService:
    """Service for generating document embeddings."""
    
    def __init__(self):
        self.legal_bert_model = None
        self.legal_bert_tokenizer = None
        self._model_loaded = False
    
    async def initialize_model(self) -> bool:
        """Initialize the LegalBERT model asynchronously."""
        try:
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor(max_workers=1) as executor:
                success = await loop.run_in_executor(
                    executor, 
                    self._load_legal_bert_model
                )
            return success
        except Exception as e:
            print(f"[WARNING] LegalBERT initialization failed: {e}")
            return False
    
    def _load_legal_bert_model(self) -> bool:
        """Load LegalBERT model synchronously."""
        try:
            print("[DEBUG] Loading LegalBERT model...")
            self.legal_bert_tokenizer = AutoTokenizer.from_pretrained(settings.embedding_model_name)
            self.legal_bert_model = AutoModel.from_pretrained(settings.embedding_model_name)
            
            # Set model to evaluation mode and move to appropriate device
            self.legal_bert_model.eval()
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.legal_bert_model.to(device)
            
            self._model_loaded = True
            print(f"[DEBUG] LegalBERT model loaded successfully on device: {device}")
            return True
        except Exception as e:
            print(f"[WARNING] Failed to load LegalBERT model: {e}")
            print(f"[INFO] Will use API fallback for embeddings")
            return False
    
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text chunks to embed
            
        Returns:
            List of embedding vectors
            
        Raises:
            EmbeddingServiceError: If embedding generation fails
        """
        try:
            # Try LegalBERT first if available
            if self._model_loaded and self.legal_bert_model is not None:
                return await self._generate_legal_bert_embeddings(texts)
            else:
                # Fallback to HuggingFace API
                return await self._generate_api_embeddings(texts)
                
        except Exception as e:
            raise EmbeddingServiceError(f"Failed to generate embeddings: {str(e)}")
    
    async def _generate_legal_bert_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using local LegalBERT model."""
        try:
            device = next(self.legal_bert_model.parameters()).device
            
            # Process texts in batches to avoid memory issues
            batch_size = 8
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Tokenize the batch
                inputs = self.legal_bert_tokenizer(
                    batch_texts,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                ).to(device)
                
                # Generate embeddings
                with torch.no_grad():
                    outputs = self.legal_bert_model(**inputs)
                    # Use mean pooling of the last hidden state
                    embeddings = outputs.last_hidden_state.mean(dim=1)
                    all_embeddings.extend(embeddings.cpu().numpy().tolist())
            
            return all_embeddings
            
        except Exception as e:
            print(f"[WARNING] LegalBERT embedding failed: {e}")
            # Fallback to API
            return await self._generate_api_embeddings(texts)
    
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
