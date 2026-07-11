# Hugging Face Space (Docker SDK) for the Golden Batch backend.
# This Space clones the GitHub repo and runs the FastAPI service on port 7860.
# To update after a GitHub push: open the Space → Settings → "Factory rebuild".
FROM python:3.12-slim

# libgomp1 = OpenMP runtime required by xgboost / lightgbm.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Clone the source (repo must be PUBLIC; for a private repo use a build secret token).
RUN git clone --depth 1 https://github.com/heewonkim-git/goldenbatchai.git /app

WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# HF containers run as a non-root user; make runtime paths writable.
RUN mkdir -p /app/backend/artifacts && chmod -R 777 /app

ENV SEED_MODE=1 PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
