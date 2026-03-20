from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from ..core.groq_client import stream_chat, chat_with_model

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    domain: Optional[str] = "general"
    streaming: bool = True

DOMAIN_PROMPTS = {
    "mental_wellness": "You are a compassionate mental health support AI. Provide empathetic, evidence-based responses. Always recommend professional help for serious concerns.",
    "legal": "You are a legal research assistant specializing in case law analysis. Provide structured legal reasoning with relevant precedents. Always note this is not legal advice.",
    "code": "You are an expert software engineer. Write clean, well-commented code. Explain trade-offs and best practices.",
    "general": "You are TuneLab AI, an intelligent assistant for LLM fine-tuning and AI development."
}

@router.post("/chat")
async def chat(req: ChatRequest):
    system = req.system_prompt or DOMAIN_PROMPTS.get(req.domain, DOMAIN_PROMPTS["general"])
    msgs = [{"role": m.role, "content": m.content} for m in req.messages]
    
    if req.streaming:
        def generate():
            for chunk in stream_chat(msgs, system_prompt=system, temperature=req.temperature):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(generate(), media_type="text/event-stream")
    
    response = chat_with_model(msgs, system_prompt=system, temperature=req.temperature)
    return {"response": response}

@router.post("/generate-system-prompt")
async def gen_prompt(payload: dict):
    from ..core.groq_client import generate_system_prompt
    result = generate_system_prompt(payload.get("domain", "general"), payload.get("task", "generation"))
    return {"system_prompt": result}
