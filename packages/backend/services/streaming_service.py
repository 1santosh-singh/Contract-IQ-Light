"""
Streaming service for real-time AI responses.
"""
import json
from typing import AsyncGenerator
from openai import AsyncOpenAI
from config import settings

class StreamingService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
    
    async def stream_chat_completion(
        self, 
        messages: list, 
        model: str = "meta-llama/llama-3.2-3b-instruct:free"
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion responses."""
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                max_tokens=800,
                temperature=0.7
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

streaming_service = StreamingService()