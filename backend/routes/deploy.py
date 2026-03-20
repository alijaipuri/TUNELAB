from fastapi import APIRouter
from ..core.groq_client import chat_with_model

router = APIRouter()

@router.post("/generate-deploy-config")
async def generate_deploy_config(payload: dict):
    job_id = payload.get("job_id")
    domain = payload.get("domain", "general")
    platform = payload.get("platform", "docker")
    
    result = chat_with_model([{
        "role": "user",
        "content": f"Generate a production deployment configuration for a fine-tuned {domain} LLM model. Platform: {platform}. Include: Dockerfile snippet, API endpoint example, environment variables needed, scaling recommendations. Format as structured text."
    }], temperature=0.3)
    
    return {"config": result, "job_id": job_id, "platform": platform}

@router.get("/export-options")
async def export_options():
    return {
        "formats": ["LoRA Adapter (.bin)", "Merged GGUF (Q4_K_M)", "ONNX", "TensorFlow Lite", "HuggingFace Hub"],
        "platforms": ["Docker Container", "HuggingFace Space", "FastAPI + Gradio", "Kubernetes Pod", "Edge Device (RPi/Jetson)"],
        "estimated_sizes": {"LoRA": "~50MB", "GGUF_Q4": "~4GB", "ONNX": "~7GB"}
    }
