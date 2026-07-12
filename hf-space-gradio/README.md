---
title: Golden Batch Backend
emoji: 🧬
colorFrom: gray
colorTo: green
sdk: gradio
python_version: "3.12"
pinned: false
---

# Golden Batch Multi-Agent — Backend (free, Gradio-hosted FastAPI)

Hosts the FastAPI backend on a **free** Hugging Face Gradio Space (Docker needs
PRO; Gradio SDK is free). `app.py` clones the
[main repo](https://github.com/heewonkim-git/goldenbatchai) and serves the
FastAPI app (Analysis ML + orchestrator + MSAT Claude + RAG) on port 7860.

**Health check:** `GET /api/health`

## Space settings to configure

- **Secret** `ANTHROPIC_API_KEY` — your Anthropic key (used by the MSAT Agent).
- **Variable** `CORS_ORIGINS` — your Vercel URL, e.g. `https://goldenbatchai.vercel.app`.

The Next.js frontend (Vercel) points `NEXT_PUBLIC_API_BASE` at this Space.
