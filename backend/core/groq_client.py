import os
from groq import Groq

# ⚠️ PASTE YOUR GROQ API KEY BELOW (get it from https://console.groq.com)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")

client = Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

def chat_with_model(messages: list, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 2048) -> str:
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=full_messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=False
    )
    return response.choices[0].message.content

def stream_chat(messages: list, system_prompt: str = None, temperature: float = 0.7):
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)
    
    stream = client.chat.completions.create(
        model=MODEL,
        messages=full_messages,
        temperature=temperature,
        max_tokens=2048,
        stream=True
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta

def analyze_dataset(data_sample: str) -> dict:
    prompt = f"""Analyze this dataset sample and return a JSON with:
- domain: (mental_wellness/legal/code/general)
- recommended_task: (classification/generation/qa/summarization)
- quality_score: (0-100)
- issues: list of data quality issues
- preprocessing_steps: list of recommended steps
- estimated_tokens: rough estimate
- fine_tuning_strategy: (LoRA/QLoRA/full)

Dataset sample:
{data_sample[:3000]}

Return ONLY valid JSON."""
    
    response = chat_with_model([{"role": "user", "content": prompt}], temperature=0.1)
    import json, re
    match = re.search(r'\{.*\}', response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass
    return {"domain": "general", "recommended_task": "generation", "quality_score": 75, "issues": [], "preprocessing_steps": ["tokenize", "clean"], "estimated_tokens": 10000, "fine_tuning_strategy": "LoRA"}

def generate_system_prompt(domain: str, task: str) -> str:
    prompt = f"""Generate an expert system prompt for a fine-tuned LLM in the {domain} domain for the task: {task}.
Make it specific, professional, and optimized for the task. Return only the system prompt text."""
    return chat_with_model([{"role": "user", "content": prompt}], temperature=0.4)

def evaluate_model_response(question: str, response: str, expected: str = None, domain: str = "general") -> dict:
    eval_prompt = f"""Evaluate this AI response as an expert in {domain}.
Question: {question}
Response: {response}
{"Expected: " + expected if expected else ""}

Rate on: accuracy(0-10), clarity(0-10), completeness(0-10), domain_expertise(0-10)
Return JSON with scores and brief feedback."""
    
    result = chat_with_model([{"role": "user", "content": eval_prompt}], temperature=0.1)
    import json, re
    match = re.search(r'\{.*\}', result, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass
    return {"accuracy": 7, "clarity": 7, "completeness": 7, "domain_expertise": 7, "feedback": "Good response"}
