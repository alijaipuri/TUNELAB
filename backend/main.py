from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routes import finetune, evaluate, deploy, chat
from .core.monitor import get_system_metrics
import os

app = FastAPI(title="TuneLab API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(finetune.router, prefix="/api/finetune", tags=["Fine-Tuning"])
app.include_router(evaluate.router, prefix="/api/evaluate", tags=["Evaluation"])
app.include_router(deploy.router, prefix="/api/deploy", tags=["Deploy"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/api/system")
async def system_metrics():
    return get_system_metrics()

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "model": "llama-3.3-70b-versatile"}

static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))
