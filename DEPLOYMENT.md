# Deployment

Two machines (see PRD §5): a **Vercel** frontend and a Python backend on
**Hugging Face Spaces**. The heavy ML (xgboost / lightgbm / shap) cannot run on
Vercel serverless, so the whole Python backend — Analysis ML **+ orchestrator +
MSAT (Claude) + RAG** — runs on the Space. The `ANTHROPIC_API_KEY` lives there.

```
 Browser ──▶ Vercel (Next.js UI)  ──HTTP/SSE──▶  HF Space (FastAPI: ML + Claude + RAG)
                                                   └ ANTHROPIC_API_KEY here
```

This repo is a monorepo: `frontend/` → Vercel, `backend/` → HF Space (Docker).

---

## 1. Backend → Hugging Face Spaces (free, no card, 16 GB RAM)

The Space clones this GitHub repo and runs the FastAPI backend in Docker. The repo
must be **public** (a private repo needs a build-time token).

1. Push this repo to GitHub (see §3) and make it **public**.
2. huggingface.co → **New → Space** → SDK **Docker** (blank template). Name it e.g. `goldenbatch-backend`.
3. Add two files to the Space (web editor: "Files" → add), copying from [`hf-space/`](./hf-space):
   - `Dockerfile` — clones the repo and runs `uvicorn main:app` on port 7860.
   - `README.md` — the HF metadata header (`sdk: docker`, `app_port: 7860`).
4. Space **Settings**:
   - **Secret** `ANTHROPIC_API_KEY` = your Anthropic key (used by the MSAT Agent).
   - **Variable** `CORS_ORIGINS` = your Vercel URL (fill in after step 2 of the frontend).
5. The Space builds automatically. When it's running, the API is at
   `https://<your-username>-goldenbatch-backend.hf.space` — check `…/api/health`.

> Free HF Space: 2 vCPU / 16 GB RAM. Sleeps after ~48h idle; wakes on request.
> After a new GitHub push, rebuild via Space → Settings → **Factory rebuild**.
>
> Alternative host: [`render.yaml`](./render.yaml) is included for Render (Blueprint),
> but Render's Blueprint asks for a card even on the free plan.

## 2. Frontend → Vercel

1. Vercel → **Add New Project** → import this GitHub repo.
2. **Root Directory = `frontend`** (important — monorepo). Framework auto-detects Next.js.
3. Env var: `NEXT_PUBLIC_API_BASE` = your backend URL, e.g. `https://<username>-goldenbatch-backend.hf.space`.
4. Deploy. Open the Vercel URL and click **Run**.
5. Back on the HF Space, set the `CORS_ORIGINS` variable to this exact Vercel URL, then Factory rebuild.

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
