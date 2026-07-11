---
title: Golden Batch Backend
emoji: 🧬
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Golden Batch Multi-Agent — Backend

FastAPI service: Analysis Agent (xgboost / lightgbm / shap ML), the iteration
orchestrator, the MSAT Agent (Claude), and RAG over the CDMO knowledge base.

Built from the [main repo](https://github.com/heewonkim-git/goldenbatchai)
(`backend/`). The Next.js frontend is deployed separately on Vercel and calls
this Space via `NEXT_PUBLIC_API_BASE`.

**Health check:** `GET /api/health`

## Space settings to configure

- **Secret** `ANTHROPIC_API_KEY` — your Anthropic key (used by the MSAT Agent).
- **Variable** `CORS_ORIGINS` — your Vercel URL, e.g. `https://goldenbatchai.vercel.app`.
