# Deployment

Two machines (see PRD §5): a **Vercel** frontend and a **Render** Python backend.
The heavy ML (xgboost / lightgbm / shap) cannot run on Vercel serverless, so the
whole Python backend — Analysis ML **+ orchestrator + MSAT (Claude) + RAG** — runs
on Render. The `ANTHROPIC_API_KEY` lives on Render.

```
 Browser ──▶ Vercel (Next.js UI)  ──HTTP/SSE──▶  Render (FastAPI: ML + Claude + RAG)
                                                   └ ANTHROPIC_API_KEY here
```

This repo is a monorepo: `frontend/` → Vercel, `backend/` → Render.

---

## 1. Backend → Render

1. Push this repo to GitHub (see below).
2. Render Dashboard → **New → Blueprint** → select this repo. Render reads
   [`render.yaml`](./render.yaml) and creates the `goldenbatch-backend` web service
   (root dir `backend/`, `uvicorn main:app`).
3. Set the secret env vars in the Render dashboard:
   - `ANTHROPIC_API_KEY` = your key (added by you; used by the MSAT Agent in M4).
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://goldenbatchai.vercel.app`.
4. Deploy. Confirm `https://<service>.onrender.com/api/health` returns `{"status":"ok"}`.

> Notes: the `starter` plan is 512 MB — if SHAP/xgboost OOMs, bump to `standard`.
> Free/idle instances cold-start (tens of seconds) on first request after inactivity.

## 2. Frontend → Vercel

1. Vercel → **Add New Project** → import this GitHub repo.
2. **Root Directory = `frontend`** (important — monorepo). Framework auto-detects Next.js.
3. Env var: `NEXT_PUBLIC_API_BASE` = your Render URL, e.g. `https://goldenbatch-backend.onrender.com`.
4. Deploy. Open the Vercel URL and click **Run**.
5. Back on Render, make sure `CORS_ORIGINS` includes this exact Vercel URL, then redeploy the backend.

## 3. Push this repo to GitHub

```bash
git init
git add .
git commit -m "Golden Batch Multi-Agent — M0–M2 + design system + deploy config"
git branch -M main
git remote add origin https://github.com/heewonkim-git/goldenbatchai.git
git push -u origin main
```

## Local development

See [README.md](./README.md). `scripts/dev.ps1` runs backend + frontend locally.
For local, `frontend/.env.local` sets `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`.
