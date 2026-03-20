# ⚡ TuneLab — Personal LLM Fine-Tuning Studio

> Build, train, evaluate, and deploy domain-specific LLMs — all from a sleek futuristic UI.

![TuneLab](https://img.shields.io/badge/Model-llama--3.3--70b--versatile-6c63ff?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-00d4ff?style=for-the-badge&logo=docker)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-39ff14?style=for-the-badge&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-ff6b9d?style=for-the-badge)

---

## 🚀 Features

- ⚡ **Fine-Tune Engine** — LoRA / QLoRA / DoRA / GRPO with live loss curves
- 🤖 **AI Dataset Analysis** — Groq LLM auto-analyzes quality & recommends strategy
- 💬 **AI Playground** — Streaming chat with llama-3.3-70b-versatile
- 📊 **Evaluation Suite** — AI-scored benchmarks across domains
- 🚀 **Deploy & Export** — Docker / HuggingFace / Kubernetes / ONNX
- 📡 **System Monitor** — Live CPU, RAM, GPU metrics
- 🛡️ **Privacy Mode** — Fully local, no data leaves your machine

---

## 🧠 Domains Supported

| Domain | Use Case |
|--------|----------|
| 🧠 Mental Wellness | EEG + text multimodal fine-tuning |
| ⚖️ Legal Research | Case law + RAG |
| 💻 Code Assistant | Python, debugging, documentation |
| 🌐 General | Any custom dataset |

---

## 🐳 Quick Start (Docker)
```bash
git clone https://github.com/YourGitHubUsername/TUNELAB.git
cd TUNELAB
docker build -t tunelab:latest .
docker run -d \
  --name tunelab-studio \
  -p 7860:7860 \
  -p 9000:9000 \
  -e GROQ_API_KEY=your_groq_api_key_here \
  tunelab:latest
```

Open → **http://localhost:7860**

---

## 🗂️ Project Structure
```
TuneLab/
├── backend/
│   ├── main.py
│   ├── routes/         # finetune, chat, evaluate, deploy
│   └── core/           # groq_client, trainer, monitor
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── docker/
│   └── nginx.conf
├── Dockerfile
└── docker-compose.yml
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) |

---

## 🛠️ Tech Stack

- **Backend:** FastAPI + Groq SDK + Python 3.11
- **Frontend:** Vanilla JS SPA + Chart.js
- **Model:** llama-3.3-70b-versatile (Groq)
- **Container:** Docker + Nginx
- **Fine-Tuning:** LoRA / QLoRA / DoRA (Unsloth-ready)

---

## 📄 License

MIT © 2025
