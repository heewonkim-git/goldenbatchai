"""HF Gradio Space entrypoint that hosts the FastAPI backend for free.

The Gradio SDK is free (Docker requires HF PRO). This wrapper lets a Gradio
Space run our FastAPI app: it clones the GitHub repo, imports the FastAPI app,
mounts a tiny Gradio status page onto it, and serves everything on port 7860.
The `/api/*` routes (health, runs, SSE) work exactly as in local/Docker.

To update after a GitHub push: Space → Settings → Factory rebuild (re-clones).
"""
import os
import subprocess
import sys

REPO = "https://github.com/heewonkim-git/goldenbatchai.git"
SRC = os.path.join(os.path.dirname(__file__), "src")

# 1) Clone the backend source (repo must be PUBLIC).
if not os.path.isdir(SRC):
    subprocess.run(["git", "clone", "--depth", "1", REPO, SRC], check=True)

sys.path.insert(0, os.path.join(SRC, "backend"))
os.environ.setdefault("SEED_MODE", "1")

# 2) Import the FastAPI app (config reads ANTHROPIC_API_KEY / CORS_ORIGINS from
#    the Space's env — Secrets & Variables).
import gradio as gr  # noqa: E402
import uvicorn  # noqa: E402
from main import app as fastapi_app  # noqa: E402

# 3) Mount a minimal Gradio page so HF recognizes this as a Gradio Space.
with gr.Blocks(title="Golden Batch Backend") as demo:
    gr.Markdown(
        "# 🧬 Golden Batch Multi-Agent — Backend\n"
        "FastAPI (Analysis ML + orchestrator + MSAT Claude + RAG) is running.\n\n"
        "**API:** `/api/health`, `POST /api/runs`, SSE `/api/runs/{id}/events`.\n"
        "The Next.js frontend (Vercel) calls this Space via `NEXT_PUBLIC_API_BASE`."
    )

app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
