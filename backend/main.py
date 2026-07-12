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
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from config import settings
from orchestrator import run_iterations
from schemas import RunCreated, RunRequest
from tools import dataset as dataset_tool

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


class DatasetUpload(BaseModel):
    csv: str
    filename: str | None = None


@app.get("/api/sample-dataset")
def sample_dataset() -> dict:
    """Return the bundled lecture demo CSV so the UI can offer it for download."""
    text = dataset_tool.SEED_CSV.read_text(encoding="utf-8")
    return {"filename": "golden_batch_demo.csv", "csv": text}


@app.post("/api/datasets")
def upload_dataset(body: DatasetUpload) -> dict:
    """Register a pasted/uploaded CSV and report its columns + target candidates."""
    try:
        ds_id, df = dataset_tool.register_upload(body.csv, body.filename)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"could not parse CSV: {exc}")
    return {
        "datasetId": ds_id,
        "filename": body.filename or "uploaded.csv",
        "columns": list(map(str, df.columns)),
        "n_rows": int(len(df)),
        "targetCandidates": dataset_tool.target_candidates(df),
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
            yield {"event": "error", "data": json.dumps(
                {"stage": "orchestrator", "message": str(exc), "fatal": True})}

    return EventSourceResponse(event_generator())
