FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir \
    fastapi==0.115.0 \
    uvicorn==0.30.6 \
    groq==0.11.0 \
    python-multipart==0.0.12 \
    pydantic==2.9.2 \
    aiofiles==24.1.0 \
    httpx==0.27.2 \
    pandas==2.2.3 \
    numpy==2.1.2 \
    scikit-learn==1.5.2 \
    psutil==6.0.0

# Copy app
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create __init__ files
RUN touch /app/backend/__init__.py \
    && touch /app/backend/routes/__init__.py \
    && touch /app/backend/core/__init__.py

# ⚠️ SET YOUR GROQ API KEY HERE (or pass via docker run -e)
ENV GROQ_API_KEY=your_groq_api_key_here

EXPOSE 7860 9000

# Startup script
RUN echo '#!/bin/bash\n\
uvicorn backend.main:app --host 0.0.0.0 --port 9000 &\n\
sleep 2\n\
nginx -g "daemon off;"' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
