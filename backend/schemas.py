"""Pydantic data contracts shared across the backend.

The central invariant of this project lives here: **Analysis Agent evidence must
never carry an interpretation** (see PRD §6). ``AnalysisEvidence`` enforces
``interpretation is None`` at validation time so a contract violation raises
instead of silently leaking process conclusions into quantitative output.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# --- Run request / lifecycle -------------------------------------------------

AutoMLFramework = Literal["autogluon", "h2o"]


class RunRequest(BaseModel):
    dataset: str = Field("seed", description='"seed" or an uploaded file id')
    target: str = Field("[harvest][Harvest] Product. Yield")
    automl_framework: AutoMLFramework = "autogluon"
    max_iteration: int = Field(4, ge=1, le=10)
    time_budget_s: int = Field(120, ge=10, le=1800)


class RunCreated(BaseModel):
    runId: str


# --- Analysis Agent evidence (interpretation FORBIDDEN) ----------------------


class AnalysisEvidence(BaseModel):
    """Quantitative evidence only. ``interpretation`` is always None by contract."""

    tool: str
    target: Optional[str] = None
    model: Optional[str] = None
    n_samples: Optional[int] = None
    evidence: dict[str, Any] = Field(default_factory=dict)
    interpretation: None = None  # hard contract: never a conclusion

    @field_validator("interpretation")
    @classmethod
    def _forbid_interpretation(cls, v: Any) -> None:
        if v is not None:
            raise ValueError(
                "Analysis Agent must not interpret. 'interpretation' must be null."
            )
        return None


# --- MSAT Agent output -------------------------------------------------------


class Citation(BaseModel):
    doc: str
    section: Optional[str] = None
    quote: Optional[str] = None


class NextAction(BaseModel):
    type: Literal["re_analysis", "stop"]
    tool: Optional[str] = None
    params: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""


class MsatResult(BaseModel):
    iteration: int
    interpretation: str
    hypothesis: str
    confidence: Literal["low", "medium", "high"] = "medium"
    citations: list[Citation] = Field(default_factory=list)
    next_action: NextAction


# --- SSE event envelope ------------------------------------------------------

EventType = Literal[
    "run.started",
    "analysis.started",
    "analysis.result",
    "msat.started",
    "msat.retrieval",
    "msat.token",
    "msat.result",
    "iteration.completed",
    "run.finished",
    "error",
]


class StreamEvent(BaseModel):
    type: EventType
    data: dict[str, Any] = Field(default_factory=dict)
