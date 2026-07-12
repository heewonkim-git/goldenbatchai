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


class ModelConfig(BaseModel):
    """Per-model enable flag + real hyperparameters passed to the estimator."""
    enabled: bool = True
    params: dict[str, Any] = Field(default_factory=dict)


class AnalysisConfig(BaseModel):
    """Tunable knobs for the Analysis Agent's real ML/stat code."""
    test_size: float = Field(0.2, ge=0.05, le=0.5)
    cv_folds: int = Field(5, ge=2, le=10)
    random_state: int = Field(42, ge=0)
    p_value_alpha: float = Field(0.05, gt=0.0, lt=0.5)
    num_selected: int = Field(15, ge=3, le=40)
    shap_runs: int = Field(3, ge=1, le=10)
    models: dict[str, ModelConfig] = Field(default_factory=dict)


class MsatConfig(BaseModel):
    """MSAT Agent grounding controls."""
    enabled_docs: Optional[list[str]] = None   # None => all documents
    retrieval_k: int = Field(5, ge=1, le=12)


class RunRequest(BaseModel):
    dataset: str = Field("seed", description='"seed" or an uploaded file id')
    target: str = Field("[harvest][Harvest] Product. Yield")
    automl_framework: AutoMLFramework = "autogluon"
    max_iteration: int = Field(4, ge=1, le=10)
    time_budget_s: int = Field(120, ge=10, le=1800)
    analysis_config: AnalysisConfig = Field(default_factory=AnalysisConfig)
    msat_config: MsatConfig = Field(default_factory=MsatConfig)


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
    doc_id: Optional[str] = None
    section: Optional[str] = None
    quote: Optional[str] = None


class NextAction(BaseModel):
    type: Literal["re_analysis", "stop"]
    tool: Optional[str] = None
    params: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""
    rationale_ko: str = ""


class MsatResult(BaseModel):
    iteration: int
    interpretation: str
    interpretation_ko: str = ""
    hypothesis: str
    hypothesis_ko: str = ""
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
