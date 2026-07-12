"""FastAPI entrypoint for the Golden Batch Multi-Agent backend.

Run (from the backend/ directory):
    uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import json
import uuid
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from config import settings
from orchestrator import run_iterations
from schemas import RunCreated, RunRequest

app = FastAPI(title="Golden Batch Multi-Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory run registry (M0). Persistent store is out of scope for the demo.
_RUNS: dict[str, RunRequest] = {}


@app.get("/")
def root() -> dict:
    return {
        "service": "Golden Batch Multi-Agent — backend",
        "status": "running",
        "health": "/api/health",
        "endpoints": ["/api/health", "POST /api/runs", "/api/runs/{id}/events (SSE)"],
    }


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "seed_mode": settings.seed_mode,
        "automl_framework": settings.automl_framework,
        "msat_model": settings.msat_model,
        "has_api_key": settings.has_api_key,
    }


@app.post("/api/runs", response_model=RunCreated)
def create_run(req: RunRequest) -> RunCreated:
    run_id = uuid.uuid4().hex[:12]
    _RUNS[run_id] = req
    return RunCreated(runId=run_id)


@app.get("/api/runs/{run_id}/events")
async def run_events(run_id: str) -> EventSourceResponse:
    req = _RUNS.get(run_id)
    if req is None:
        raise HTTPException(status_code=404, detail="run not found")

    async def event_generator() -> AsyncIterator[dict]:
        try:
            async for ev in run_iterations(run_id, req):
                yield {"event": ev.type, "data": json.dumps(ev.data, ensure_ascii=False)}
        except Exception as exc:  # surface errors to the UI instead of dropping the stream
            yield {"event": "error", "data": json.dumps({"stage": "orchestrator", "message": str(exc)})}

    return EventSourceResponse(event_generator())
