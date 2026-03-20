import pandas as pd
import numpy as np
import json
import re
import io
from typing import Union

def load_dataset(content: bytes, filename: str) -> pd.DataFrame:
    ext = filename.lower().split('.')[-1]
    if ext == 'csv':
        return pd.read_csv(io.BytesIO(content))
    elif ext == 'json' or ext == 'jsonl':
        try:
            data = json.loads(content.decode())
            if isinstance(data, list):
                return pd.DataFrame(data)
            return pd.DataFrame([data])
        except:
            lines = content.decode().strip().split('\n')
            rows = [json.loads(l) for l in lines if l.strip()]
            return pd.DataFrame(rows)
    elif ext == 'txt':
        lines = content.decode().strip().split('\n')
        return pd.DataFrame({'text': lines})
    raise ValueError(f"Unsupported format: {ext}")

def preprocess_for_finetuning(df: pd.DataFrame, task_type: str, input_col: str = None, output_col: str = None) -> list:
    records = []
    cols = df.columns.tolist()
    
    if task_type == "instruction_following":
        in_col = input_col or next((c for c in cols if 'input' in c.lower() or 'question' in c.lower() or 'prompt' in c.lower()), cols[0])
        out_col = output_col or next((c for c in cols if 'output' in c.lower() or 'answer' in c.lower() or 'response' in c.lower()), cols[-1])
        for _, row in df.iterrows():
            records.append({
                "instruction": str(row.get(in_col, '')),
                "output": str(row.get(out_col, '')),
                "formatted": f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n{row.get(in_col, '')}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n{row.get(out_col, '')}<|eot_id|>"
            })
    elif task_type == "classification":
        text_col = input_col or cols[0]
        label_col = output_col or cols[-1]
        for _, row in df.iterrows():
            records.append({
                "text": str(row.get(text_col, '')),
                "label": str(row.get(label_col, '')),
                "formatted": f"Classify: {row.get(text_col, '')}\nLabel: {row.get(label_col, '')}"
            })
    else:
        text_col = input_col or cols[0]
        for _, row in df.iterrows():
            records.append({"text": str(row.get(text_col, '')), "formatted": str(row.get(text_col, ''))})
    
    return records

def get_dataset_stats(df: pd.DataFrame) -> dict:
    stats = {
        "rows": len(df),
        "columns": df.columns.tolist(),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "null_counts": df.isnull().sum().to_dict(),
        "sample": df.head(3).to_dict(orient='records')
    }
    text_cols = [c for c in df.columns if df[c].dtype == object]
    if text_cols:
        col = text_cols[0]
        lengths = df[col].dropna().astype(str).apply(len)
        stats["avg_text_length"] = float(lengths.mean())
        stats["max_text_length"] = int(lengths.max())
        stats["estimated_tokens"] = int(lengths.sum() / 4)
    return stats
