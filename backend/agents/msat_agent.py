"""MSAT Agent — Claude + RAG interpretation (PRD §7).

M2 stub: no API call yet, but drives a coherent tool sequence over the REAL
Analysis evidence so the demo tells a story (SHAP driver -> pH excursion test ->
correlation -> stop). Real Anthropic call + RAG citations arrive in M4.
"""
from __future__ import annotations

from typing import Any

from schemas import AnalysisEvidence, Citation, MsatResult, NextAction
from config import settings

PH_FEATURE = "[prd_final]pH_BI"


def _top_feature(evidence: AnalysisEvidence) -> str | None:
    tf = (evidence.evidence or {}).get("top_features") if evidence else None
    if tf:
        return tf[0].get("feature")
    agg = (evidence.evidence or {}).get("aggregated_rank") if evidence else None
    if agg:
        return agg[0].get("feature")
    return None


def interpret(iteration: int, evidence: AnalysisEvidence, max_iteration: int) -> MsatResult:
    note = "" if settings.has_api_key else "  [stub — no LLM call]"
    top = _top_feature(evidence) or "the top-ranked feature"
    is_last = iteration >= max_iteration

    if iteration == 1 and not is_last:
        return MsatResult(
            iteration=iteration,
            interpretation=(f"SHAP ranks {top} as the strongest driver of yield. Per the "
                            f"CPP-CQA Matrix this is a High-criticality CPP." + note),
            hypothesis=f"{top} drives yield; low-yield batches may also show a pH excursion above 6.9.",
            confidence="medium",
            citations=[Citation(doc="CPP-CQA Matrix", section="CPP ↔ Product. Yield"),
                       Citation(doc="Process Control Strategy", section="pH deadband")],
            next_action=NextAction(
                type="re_analysis", tool="statistical_test",
                params={"feature": PH_FEATURE, "group_rule": "threshold", "threshold": 6.9},
                rationale="Test whether batches with pH_BI > 6.9 show significantly lower yield.",
            ),
        )

    if iteration == 2 and not is_last:
        p = (evidence.evidence or {}).get("p_value")
        supported = p is not None and p < 0.05
        return MsatResult(
            iteration=iteration,
            interpretation=(f"Group test {'supports' if supported else 'is inconclusive on'} the pH "
                            f"hypothesis (p={p}). Checking whether pH co-varies with over-feeding." + note),
            hypothesis="High pH combined with glucose over-feeding concentrates yield loss.",
            confidence="high" if supported else "medium",
            citations=[Citation(doc="Troubleshooting Guide", section="over-feeding → pH drift"),
                       Citation(doc="CPP-CQA Matrix", section="Interaction Effects")],
            next_action=NextAction(
                type="re_analysis", tool="correlation_analysis",
                params={"method": "spearman"},
                rationale="Quantify correlation of pH and glucose feed with yield.",
            ),
        )

    # Final iteration (or forced stop).
    return MsatResult(
        iteration=iteration,
        interpretation="Evidence is consistent across SHAP, group test, and correlation." + note,
        hypothesis=("Golden Batch window: keep pH_BI 6.7–6.9, avoid glucose over-feeding, and "
                    "maintain high VCD_BI with a strong O2 supply ramp."),
        confidence="high",
        citations=[Citation(doc="Golden Batch Criteria", section="Parameter windows"),
                   Citation(doc="Golden Batch Report", section="Recommended window")],
        next_action=NextAction(type="stop", rationale="Hypothesis confirmed across methods."),
    )
