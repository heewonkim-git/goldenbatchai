"""Analysis Agent — quantitative evidence only (PRD §6).

Dispatches a tool request to the real ML/stat implementations in ``tools/`` and
wraps the result in ``AnalysisEvidence`` (which forbids any interpretation).
The dataframe is loaded once per run and passed in by the orchestrator.
"""
from __future__ import annotations

from typing import Any

import pandas as pd

from schemas import AnalysisEvidence
from tools import dataset, ml, stats

TOOLS = [
    "automl",
    "remove_multicollinearity",
    "feature_selection",
    "shap_analysis",
    "model_compare",
    "statistical_test",
    "correlation_analysis",
    "re_analysis",
]


def run_tool(tool: str, df: pd.DataFrame, target: str,
             params: dict[str, Any] | None = None) -> AnalysisEvidence:
    """Execute one Analysis tool and return quantitative evidence (no interpretation)."""
    params = params or {}

    # re_analysis just re-dispatches to a concrete tool chosen by MSAT.
    if tool == "re_analysis":
        tool = params.get("tool", "statistical_test")

    if tool not in TOOLS or tool == "re_analysis":
        raise ValueError(f"unknown analysis tool: {tool!r}")

    if tool in {"statistical_test", "correlation_analysis"}:
        # These operate on the raw dataframe (need target + chosen feature[s]).
        if tool == "statistical_test":
            feature = params.get("feature") or _default_feature(df, target)
            evidence = stats.statistical_test(
                df, target, feature,
                group_rule=params.get("group_rule", "median_split"),
                threshold=params.get("threshold"),
            )
        else:
            feats = params.get("features") or dataset.feature_columns(df, target)
            evidence = stats.correlation_analysis(df, target, feats, method=params.get("method", "spearman"))
        return _wrap(tool, target, evidence)

    # Model-based tools operate on cleaned (X, y).
    X, y = dataset.prepare_xy(df, target)
    if tool == "automl":
        evidence = ml.automl(X, y)
    elif tool == "remove_multicollinearity":
        evidence = ml.remove_multicollinearity(X, threshold=params.get("threshold", 0.9))
    elif tool == "feature_selection":
        evidence = ml.feature_selection(X, y, num_selected=params.get("num_selected", 15))
    elif tool == "shap_analysis":
        evidence = ml.shap_analysis(X, y, model=params.get("model", "xgboost"),
                                    runs=params.get("runs", 3))
    elif tool == "model_compare":
        evidence = ml.model_compare(X, y)
    else:  # pragma: no cover
        raise ValueError(f"unhandled tool: {tool!r}")

    return _wrap(tool, target, evidence, model=params.get("model"), n=int(len(y)))


def _default_feature(df: pd.DataFrame, target: str) -> str:
    feats = dataset.feature_columns(df, target)
    return feats[0] if feats else target


def _wrap(tool: str, target: str, evidence: dict, model: str | None = None,
          n: int | None = None) -> AnalysisEvidence:
    return AnalysisEvidence(
        tool=tool, target=target, model=model, n_samples=n,
        evidence=evidence, interpretation=None,
    )
