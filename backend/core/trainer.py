import asyncio
import time
import random
import json
from typing import AsyncGenerator
from .groq_client import chat_with_model

# Simulated training engine (for demo; replace with real Unsloth on GPU machine)
TRAINING_JOBS = {}

async def start_training_job(job_id: str, config: dict, dataset_records: list) -> None:
    TRAINING_JOBS[job_id] = {
        "status": "running",
        "progress": 0,
        "logs": [],
        "metrics": {"train_loss": [], "eval_loss": [], "learning_rate": [], "steps": []},
        "config": config,
        "start_time": time.time()
    }
    
    epochs = config.get("epochs", 3)
    steps_per_epoch = max(10, min(len(dataset_records) // config.get("batch_size", 4), 50))
    total_steps = epochs * steps_per_epoch
    lr = config.get("learning_rate", 2e-4)
    base_loss = 2.5
    
    for step in range(1, total_steps + 1):
        if TRAINING_JOBS[job_id].get("cancelled"):
            TRAINING_JOBS[job_id]["status"] = "cancelled"
            return
        
        await asyncio.sleep(0.3)
        
        decay = (base_loss - 0.4) * (1 - step / total_steps) ** 1.5 + 0.4
        noise = random.gauss(0, 0.03)
        train_loss = max(0.2, decay + noise)
        eval_loss = train_loss + random.uniform(0.02, 0.08)
        current_lr = lr * (0.95 ** (step // 10))
        
        job = TRAINING_JOBS[job_id]
        job["metrics"]["train_loss"].append(round(train_loss, 4))
        job["metrics"]["eval_loss"].append(round(eval_loss, 4))
        job["metrics"]["learning_rate"].append(round(current_lr, 6))
        job["metrics"]["steps"].append(step)
        job["progress"] = int((step / total_steps) * 100)
        
        epoch_num = (step - 1) // steps_per_epoch + 1
        if step % 5 == 0:
            log = f"[Epoch {epoch_num}/{epochs}] Step {step}/{total_steps} | loss={train_loss:.4f} | lr={current_lr:.2e}"
            job["logs"].append(log)
    
    TRAINING_JOBS[job_id]["status"] = "completed"
    TRAINING_JOBS[job_id]["progress"] = 100
    TRAINING_JOBS[job_id]["end_time"] = time.time()
    
    # Use Groq to generate final evaluation summary
    summary = chat_with_model([{
        "role": "user",
        "content": f"Generate a brief training completion report for a {config.get('domain','general')} LLM fine-tuned with config: {json.dumps(config)}. Final loss: {TRAINING_JOBS[job_id]['metrics']['train_loss'][-1]:.4f}. Include perplexity estimate, key takeaways, and deployment recommendations."
    }], temperature=0.3)
    TRAINING_JOBS[job_id]["summary"] = summary

def get_job_status(job_id: str) -> dict:
    return TRAINING_JOBS.get(job_id, {"status": "not_found"})

def cancel_job(job_id: str) -> bool:
    if job_id in TRAINING_JOBS:
        TRAINING_JOBS[job_id]["cancelled"] = True
        return True
    return False

def list_jobs() -> list:
    return [{"job_id": jid, "status": job["status"], "progress": job["progress"], "config": job.get("config", {})} for jid, job in TRAINING_JOBS.items()]
