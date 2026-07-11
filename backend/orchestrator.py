"""Orchestrator — the Analysis <-> MSAT iteration loop (PRD §9).

Async generator yielding ``StreamEvent`` objects; the SSE endpoint forwards them.
M2: Analysis Agent runs REAL ML on the seed dataset. MSAT is still a stub (real
Claude + RAG arrive in M4), but it drives a coherent tool sequence so the demo
shows genuine evidence being interpreted.
"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

import pandas as pd

from agents import analysis_agent, msat_agent
from schemas import RunRequest, StreamEvent
from tools import dataset

# Iteration 1 runs a small battery so the opening shows the full pipeline.
OPENING_TOOLS = ["automl", "feature_selection", "shap_analysis"]


async def run_iterations(run_id: str, req: RunRequest) -> AsyncIterator[StreamEvent]:
    df = dataset.load_dataset(req.dataset)

    yield StreamEvent(type="run.started", data={
        "runId": run_id, "target": req.target, "automl_framework": req.automl_framework,
        "maxIter": req.max_iteration, "dataset": req.dataset, "n_rows": int(len(df)),
    })

    prev_hypothesis: str | None = None
    final_reco = "No conclusion reached."
    next_tool = "shap_analysis"
    next_params: dict = {}

    for iteration in range(1, req.max_iteration + 1):
        tools = OPENING_TOOLS if iteration == 1 else [next_tool]
        last_evidence = None

        for tool in tools:
            yield StreamEvent(type="analysis.started", data={"iteration": iteration, "tool": tool})
            evidence = await asyncio.to_thread(
                analysis_agent.run_tool, tool, df, req.target, next_params if tool == next_tool else {}
            )
            last_evidence = evidence
            yield StreamEvent(type="analysis.result", data={
                "iteration": iteration, "tool": tool, "evidence": evidence.evidence,
            })

        # --- MSAT interpretation ---
        yield StreamEvent(type="msat.started", data={"iteration": iteration})
        msat = await asyncio.to_thread(
            msat_agent.interpret, iteration, last_evidence, req.max_iteration
        )
        yield StreamEvent(type="msat.result", data={
            "iteration": iteration,
            "interpretation": msat.interpretation,
            "hypothesis": msat.hypothesis,
            "confidence": msat.confidence,
            "citations": [c.model_dump() for c in msat.citations],
            "next_action": msat.next_action.model_dump(),
        })
        yield StreamEvent(type="iteration.completed", data={"iteration": iteration})

        # --- Stopping conditions (PRD §9.2) ---
        if msat.next_action.type == "stop":
            final_reco = msat.hypothesis
            break
        if prev_hypothesis is not None and msat.hypothesis == prev_hypothesis:
            final_reco = f"Converged: {msat.hypothesis}"
            break
        prev_hypothesis = msat.hypothesis
        next_tool = msat.next_action.tool or "statistical_test"
        next_params = msat.next_action.params or {}
    else:
        final_reco = prev_hypothesis or final_reco

    yield StreamEvent(type="run.finished", data={"finalRecommendation": final_reco})
