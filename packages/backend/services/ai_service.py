"""
AI service for chat and analysis functionality.
"""
import asyncio
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI, AuthenticationError, RateLimitError

from config import settings
from exceptions import AIServiceError
from utils.cache import get_cached_document_analysis, cache_document_analysis


class AIService:
    """Service for AI-powered chat and analysis."""
    
    def __init__(self):
        self.openai_client = None
        self.fallback_client = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize OpenAI clients with primary and fallback keys."""
        # Primary client
        if settings.openrouter_api_key:
            self.openai_client = AsyncOpenAI(
                api_key=settings.openrouter_api_key,
                base_url="https://openrouter.ai/api/v1",
            )
            print("[INFO] OpenRouter primary API key loaded")
        else:
            print("[WARNING] OpenRouter primary API key not configured")
        
        # Fallback client
        if settings.openrouter_api_key_fallback:
            self.fallback_client = AsyncOpenAI(
                api_key=settings.openrouter_api_key_fallback,
                base_url="https://openrouter.ai/api/v1",
            )
            print("[INFO] OpenRouter fallback API key loaded")
        else:
            print("[INFO] OpenRouter fallback API key not configured")
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "meta-llama/llama-3.2-3b-instruct:free",
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """
        Generate chat completion using OpenAI API.
        
        Args:
            messages: List of message dictionaries
            model: Model to use for completion
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Generated response text
            
        Raises:
            AIServiceError: If completion fails
        """
        # Try primary client first
        client = self.openai_client
        if not client:
            if self.fallback_client:
                print("[AI Service] Primary client not available, using fallback")
                client = self.fallback_client
            else:
                raise AIServiceError("OpenAI client not initialized")
        
        try:
            print(f"[AI Service] Calling OpenRouter with model: {model}, max_tokens: {max_tokens}")
            completion = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            print(f"[AI Service] OpenRouter response received: {completion.choices if completion.choices else 'No choices'}")
            print(f"[AI Service] Number of choices: {len(completion.choices) if completion.choices else 0}")
            
            if completion.choices and len(completion.choices) > 0:
                # Check for content first
                response_content = completion.choices[0].message.content
                
                # If content is empty but there's reasoning, use that
                if not response_content and hasattr(completion.choices[0].message, 'reasoning'):
                    print("[AI Service] Content empty, checking reasoning field...")
                    if completion.choices[0].message.reasoning:
                        print("[AI Service] Using reasoning field as content")
                        response_content = completion.choices[0].message.reasoning
                
                print(f"[AI Service] Response content type: {type(response_content)}, Length: {len(response_content) if response_content else 0}")
                if not response_content:
                    print("[AI Service] WARNING: Empty content in response")
                    raise AIServiceError("Empty response from AI model")
            else:
                print("[AI Service] ERROR: No choices in completion")
                raise AIServiceError("No choices in completion response")
            
            return response_content
            
        except (AuthenticationError, RateLimitError) as e:
            # Try fallback client if primary failed
            if self.fallback_client and client != self.fallback_client:
                print(f"[AI Service] Primary key failed: {str(e)}, trying fallback key...")
                try:
                    completion = await self.fallback_client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    )
                    
                    if completion.choices and len(completion.choices) > 0:
                        response_content = completion.choices[0].message.content
                        if not response_content and hasattr(completion.choices[0].message, 'reasoning'):
                            response_content = completion.choices[0].message.reasoning
                        
                        if response_content:
                            print("[AI Service] Fallback key succeeded")
                            return response_content
                    
                    raise AIServiceError("Empty response from fallback AI model")
                except Exception as fallback_error:
                    print(f"[AI Service] Fallback key also failed: {str(fallback_error)}")
                    return self._get_fallback_response("chat", str(e))
            
            # Return fallback response for auth/rate limit errors
            return self._get_fallback_response("chat", str(e))
        except Exception as e:
            raise AIServiceError(f"Chat completion failed: {str(e)}")
    
    async def generate_summary(self, context: str) -> str:
        """
        Generate document summary.
        
        Args:
            context: Document content to summarize
            
        Returns:
            Generated summary
            
        Raises:
            AIServiceError: If summarization fails
        """
        try:
            messages = [
                {
                    "role": "system",
                    "content": "Provide a concise summary of the legal contract in simple, easy-to-understand language. Use everyday words and avoid complex legal jargon—explain any necessary terms simply. Structure the summary in Markdown format with these clear sections: ## Parties Involved:, ## Key Terms:, ## Obligations:, ## Potential Risks:, and ## Next Steps:. Use bullet points for lists within sections. Do not include any introductory text, greetings, or extra explanations outside these sections."
                },
                {
                    "role": "user",
                    "content": f"Summarize the following contract:\n\n{context}"
                }
            ]
            
            return await self.chat_completion(
                messages=messages,
                model="nvidia/nemotron-nano-9b-v2:free",
                max_tokens=1000,
                temperature=0.1
            )
            
        except AIServiceError:
            raise
        except Exception as e:
            raise AIServiceError(f"Summary generation failed: {str(e)}")
    
    async def generate_risk_analysis(self, context: str) -> str:
        """
        Generate risk analysis for contract.
        
        Args:
            context: Document content to analyze
            
        Returns:
            Generated risk analysis in HTML format
            
        Raises:
            AIServiceError: If analysis fails
        """
        try:
            print("[AI Service] Generating risk analysis...")
            print(f"[AI Service] API Key loaded: {bool(settings.openrouter_api_key)}")
            print(f"[AI Service] OpenAI client initialized: {bool(self.openai_client)}")
            
            system_prompt = """Analyze the legal contract for potential risks. Categorize each risk as high, medium, or low severity.

Output the entire analysis in HTML format only. Structure with three sections: High Risks (red theme), Medium Risks (yellow theme), Low Risks (green theme).

For each section:
1. Use a centered pill-style heading: <div style="text-align: center; margin-bottom: 15px;"><span style="background-color: red; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; display: inline-block; text-align: center;">High Risks</span></div> (use orange for medium, green for low).

2. Then a container <div style="background-color: rgba(255,0,0,0.05); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid red; text-align: left;"> (adjust colors for each section).

3. Inside the container, use <ul style="margin: 0; padding-left: 20px; list-style-type: disc;"> for the list of risks.

4. For each risk <li>, identify the specific risky clause or term and highlight ONLY that part using <span style="background-color: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;">[RISKY CLAUSE]</span> (use red for high, orange for medium, green for low).

5. Add <div style="height: 20px;"></div> between sections for gap.

6. Do not include any other sections or non-HTML content. Make sure headings are centered and containers have proper styling."""


            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze the following contract for risks:\n\n{context}"}
            ]
            
            print("[AI Service] Calling OpenRouter API...")
            result = await self.chat_completion(
                messages=messages,
                model="nvidia/nemotron-nano-9b-v2:free",
                max_tokens=2000,
                temperature=0.1
            )
            print(f"[AI Service] Risk analysis completed successfully ({len(result)} chars)")
            return result
            
        except AIServiceError as e:
            print(f"[AI Service] Error during risk analysis: {str(e)}")
            raise
        except Exception as e:
            print(f"[AI Service] Unexpected error during risk analysis: {str(e)}")
            raise AIServiceError(f"Risk analysis generation failed: {str(e)}")
    
    async def generate_document_query_response(
        self, 
        context: str, 
        query: str, 
        use_rag: bool = True
    ) -> str:
        """
        Generate response for document query.
        
        Args:
            context: Document context
            query: User query
            use_rag: Whether to use RAG-specific prompting
            
        Returns:
            Generated response
            
        Raises:
            AIServiceError: If response generation fails
        """
        try:
            if use_rag:
                system_content = "You are a helpful assistant that answers questions based ONLY on the provided document context. Do not use external knowledge. If the answer is not in the context, say 'The information is not available in the document.' Respond concisely and professionally. Always cite which part of the document you're referencing when possible."
            else:
                system_content = "You are a helpful assistant that answers questions about documents. First, identify what type of document this is (contract, résumé, report, etc.) based on the content. Then answer the user's question based on the document content. If the document is not a contract but the user asks about contract elements, explain what type of document it actually is and what information is available instead."
            
            messages = [
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"Document Context:\n{context}\n\nQuestion: {query}\n\nPlease provide a clear, accurate answer based on the document context above."}
            ]
            
            return await self.chat_completion(
                messages=messages,
                model="nvidia/nemotron-nano-9b-v2:free",
                max_tokens=800,
                temperature=0.1
            )
            
        except AIServiceError:
            raise
        except Exception as e:
            raise AIServiceError(f"Document query response generation failed: {str(e)}")
    
    def _get_fallback_response(self, operation: str, error: str) -> str:
        """Get fallback response for failed operations."""
        fallback_responses = {
            "chat": "I'm sorry, but I'm currently unable to access the AI model due to authentication or rate limit issues. Please check your API key on OpenRouter. For now, here's a sample response: **Key Advice:** Review all clauses carefully, especially termination and liability sections.",
            "summary": """## Parties Involved:
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
- Sign and return by the deadline.""",
            "risk_analysis": """
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
        }
        
        return fallback_responses.get(operation, "AI service temporarily unavailable. Please try again later.")


# Global AI service instance
ai_service = AIService()
