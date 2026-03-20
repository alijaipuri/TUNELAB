from fastapi import APIRouter
from ..core.groq_client import evaluate_model_response, chat_with_model
import json

router = APIRouter()

@router.post("/evaluate")
async def evaluate(payload: dict):
    question = payload.get("question", "")
    response = payload.get("response", "")
    expected = payload.get("expected", None)
    domain = payload.get("domain", "general")
    result = evaluate_model_response(question, response, expected, domain)
    return result

@router.post("/benchmark")
async def benchmark(payload: dict):
    domain = payload.get("domain", "general")
    test_cases = payload.get("test_cases", [])
    
    if not test_cases:
        # Generate benchmark test cases using Groq
        gen = chat_with_model([{
            "role": "user",
            "content": f"Generate 5 benchmark test questions for a {domain} AI model. Return JSON array with objects having 'question' and 'expected_keywords' fields."
        }], temperature=0.3)
        import re
        match = re.search(r'\[.*\]', gen, re.DOTALL)
        test_cases = json.loads(match.group()) if match else []
    
    results = []
    for tc in test_cases[:5]:
        q = tc.get("question", "")
        resp = chat_with_model([{"role": "user", "content": q}], temperature=0.5)
        score = evaluate_model_response(q, resp, None, domain)
        results.append({"question": q, "response": resp[:300], "scores": score})
    
    avg_score = sum(r["scores"].get("accuracy", 7) for r in results) / max(len(results), 1)
    return {"results": results, "average_score": round(avg_score, 2), "domain": domain}
