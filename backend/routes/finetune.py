from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import Optional
import uuid
import json
from ..core.dataset_processor import load_dataset, preprocess_for_finetuning, get_dataset_stats
from ..core.groq_client import analyze_dataset
from ..core.trainer import start_training_job, get_job_status, cancel_job, list_jobs

router = APIRouter()
DATASETS = {}

@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = load_dataset(content, file.filename)
        stats = get_dataset_stats(df)
        sample_text = df.to_csv(index=False)[:2000]
        analysis = analyze_dataset(sample_text)
        dataset_id = str(uuid.uuid4())[:8]
        DATASETS[dataset_id] = {"df": df, "filename": file.filename, "stats": stats, "analysis": analysis}
        return {"dataset_id": dataset_id, "stats": stats, "analysis": analysis, "filename": file.filename}
    except Exception as e:
        return {"error": str(e)}

@router.post("/start-training")
async def start_training(background_tasks: BackgroundTasks, payload: dict):
    dataset_id = payload.get("dataset_id")
    config = payload.get("config", {})
    
    if dataset_id and dataset_id in DATASETS:
        df = DATASETS[dataset_id]["df"]
        analysis = DATASETS[dataset_id]["analysis"]
        config["domain"] = analysis.get("domain", "general")
        task = analysis.get("recommended_task", "generation")
        records = preprocess_for_finetuning(df, task)
    else:
        records = [{"text": "sample", "formatted": "sample"}] * 20
    
    job_id = str(uuid.uuid4())[:12]
    background_tasks.add_task(start_training_job, job_id, config, records)
    return {"job_id": job_id, "status": "started", "config": config}

@router.get("/job/{job_id}")
async def job_status(job_id: str):
    return get_job_status(job_id)

@router.delete("/job/{job_id}")
async def cancel_training(job_id: str):
    success = cancel_job(job_id)
    return {"cancelled": success}

@router.get("/jobs")
async def all_jobs():
    return list_jobs()
