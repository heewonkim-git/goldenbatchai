"""MSAT Agent — Claude + RAG interpretation (PRD §7).

M4: real Anthropic call. The MSAT Agent reads the Analysis Agent's quantitative
evidence, retrieves grounding passages from the CDMO knowledge base (RAG), and
returns a structured interpretation + hypothesis + next action, citing only the
retrieved documents. Falls back to a scripted stub when no API key is set or the
call fails, so the demo always runs.
"""
from __future__ import annotations

import json
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from config import settings
from rag.store import store
from schemas import AnalysisEvidence, Citation, MsatResult, NextAction

PH_FEATURE = "[prd_final]pH_BI"
ALLOWED_TOOLS = [
    "statistical_test", "correlation_analysis", "feature_selection",
    "shap_analysis", "model_compare", "remove_multicollinearity",
]

SYSTEM = """You are an MSAT (Manufacturing Science & Technology) process expert for a mAb CDMO.
An Analysis Agent gives you QUANTITATIVE ML evidence (SHAP, model RMSE, p-values, correlations).
Your job: interpret that evidence in process terms, ground every claim in the provided knowledge-base
excerpts, form/refine ONE hypothesis about what drives yield, and decide the next analysis step.

Rules:
- Cite ONLY the provided document excerpts. Never invent a document, section, or number.
- The evidence is the source of truth for numbers; the documents explain their process meaning.
- Choose next_action.type = "stop" when the evidence across steps is consistent and a Golden Batch
  recommendation can be made, or when you have no better analysis to request. Otherwise "re_analysis"
  with one tool from the allowed list and concrete params (use real feature names from the evidence).
- Be concise and specific. No hedging, no restating the raw numbers verbatim."""


class MsatLLM(BaseModel):
    interpretation: str = Field(description="Process interpretation of the evidence, 1-3 sentences.")
    interpretation_ko: str = Field(default="", description="Korean rendering of interpretation.")
    hypothesis: str = Field(description="One concrete, testable hypothesis about a yield driver.")
    hypothesis_ko: str = Field(default="", description="Korean rendering of hypothesis.")
    confidence: Literal["low", "medium", "high"]
    citations: list[Citation] = Field(default_factory=list)
    next_action: NextAction


def _extract_json(text: str) -> dict[str, Any]:
    """Pull the first JSON object out of an LLM response (tolerates code fences)."""
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.startswith("json"):
            t = t[4:]
    start, end = t.find("{"), t.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in MSAT response")
    return json.loads(t[start : end + 1])


def _query(evidence: AnalysisEvidence, target: str) -> str:
    parts = [evidence.tool, target, "yield CPP golden batch"]
    ev = evidence.evidence or {}
    for key in ("top_features", "aggregated_rank"):
        for row in (ev.get(key) or [])[:4]:
            if isinstance(row, dict) and row.get("feature"):
                parts.append(row["feature"])
    if evidence.tool == "statistical_test":
        parts.append("pH excursion group difference")
    return " ".join(parts)


def retrieve_for(evidence: AnalysisEvidence, k: int = 5, allowed_ids=None):
    """RAG retrieval step (exposed so the orchestrator can show it in the UI)."""
    target = evidence.target or "yield"
    return store.search(_query(evidence, target), k=k, allowed_ids=allowed_ids)


def _enrich(citations: list[Citation]) -> list[Citation]:
    """Attach the resolved knowledge-base doc id to each cited title."""
    for c in citations:
        if not c.doc_id:
            c.doc_id = store.resolve_id(c.doc)
    return citations


def interpret(iteration: int, evidence: AnalysisEvidence, max_iteration: int,
              chunks=None, msat_config=None) -> MsatResult:
    target = evidence.target or "yield"
    k = getattr(msat_config, "retrieval_k", 5) or 5
    allowed = getattr(msat_config, "enabled_docs", None)
    if not settings.has_api_key:
        res = _stub_interpret(iteration, evidence, max_iteration)
        res.citations = _enrich(res.citations)
        return res
    try:
        if chunks is None:
            chunks = retrieve_for(evidence, k=k, allowed_ids=allowed)
        res = _claude_interpret(iteration, evidence, max_iteration, target, chunks)
        res.citations = _enrich(res.citations)
        return res
    except Exception as exc:  # never break the run on an LLM/parse error
        res = _stub_interpret(iteration, evidence, max_iteration)
        res.interpretation = f"[LLM error, stub fallback: {exc}] " + res.interpretation
        res.citations = _enrich(res.citations)
        return res


def _claude_interpret(iteration: int, evidence: AnalysisEvidence, max_iteration: int,
                      target: str, chunks) -> MsatResult:
    import anthropic

    kb = "\n\n".join(f"[{c.doc} :: {c.section}]\n{c.text[:900]}" for c in chunks) or "(none)"
    forced_stop = iteration >= max_iteration

    user = f"""Iteration {iteration} of {max_iteration}. Target CQA: {target}

## Analysis evidence (tool: {evidence.tool})
{json.dumps(evidence.evidence, ensure_ascii=False)[:4000]}

## Knowledge-base excerpts (cite these; doc :: section)
{kb}

## Allowed next-action tools
{", ".join(ALLOWED_TOOLS)}

{"This is the final iteration — set next_action.type to 'stop' and give the Golden Batch recommendation."
   if forced_stop else "Decide whether to stop (enough evidence) or request one more analysis."}
In the "interpretation" text, insert bracketed citation markers [1], [2], ... right after each
claim that a document supports, numbered to match the ORDER of the citations array (citations[0]
is [1], citations[1] is [2], ...). Every citation you list must be referenced at least once in the
text, and every marker must have a matching citations entry. Put each cited passage's doc, section,
and the exact quoted sentence in citations.

Also provide Korean renderings: "interpretation_ko", "hypothesis_ko", and "rationale_ko" inside
next_action. Keep domain/technical terms in English (e.g. yield, VCD, DO, pH, SHAP, p-value) and
write only the connective/descriptive prose in Korean, e.g. "DO 값이 줄어듦에 따라 yield가 낮아짐".
Put the SAME [1],[2] citation markers in the Korean interpretation_ko, at the matching claims."""

    user += (
        "\n\nRespond with ONLY a JSON object (no prose, no markdown fences) of shape:\n"
        '{"interpretation": str, "interpretation_ko": str, "hypothesis": str, "hypothesis_ko": str, '
        '"confidence": "low|medium|high", '
        '"citations": [{"doc": str, "section": str, "quote": str}], '
        '"next_action": {"type": "re_analysis|stop", "tool": str|null, '
        '"params": {}, "rationale": str, "rationale_ko": str}}'
    )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=90.0, max_retries=2)
    resp = client.messages.create(
        model=settings.msat_model,
        max_tokens=4200,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
    out = MsatLLM(**_extract_json(text))
    action = out.next_action
    if forced_stop:
        action = NextAction(type="stop", rationale=action.rationale or "Final iteration.",
                            rationale_ko=action.rationale_ko or "최종 iteration.")
    elif action.type == "re_analysis" and action.tool not in ALLOWED_TOOLS:
        action.tool = "statistical_test"

    return MsatResult(
        iteration=iteration,
        interpretation=out.interpretation,
        interpretation_ko=out.interpretation_ko or out.interpretation,
        hypothesis=out.hypothesis,
        hypothesis_ko=out.hypothesis_ko or out.hypothesis,
        confidence=out.confidence,
        citations=out.citations,
        next_action=action,
    )


# --- Scripted fallback (no API key / error) ---------------------------------

def _top_feature(evidence: AnalysisEvidence) -> Optional[str]:
    ev = evidence.evidence or {}
    for key in ("top_features", "aggregated_rank"):
        rows = ev.get(key)
        if rows:
            return rows[0].get("feature")
    return None


def _stub_interpret(iteration: int, evidence: AnalysisEvidence, max_iteration: int) -> MsatResult:
    note = "  [stub — no LLM call]"
    top = _top_feature(evidence) or "the top-ranked feature"
    is_last = iteration >= max_iteration

    if iteration == 1 and not is_last:
        return MsatResult(
            iteration=iteration,
            interpretation=f"SHAP ranks {top} as the strongest yield driver; a High-criticality CPP." + note,
            interpretation_ko=f"SHAP 결과 {top}가 yield에 가장 큰 영향을 주는 driver로, High criticality CPP입니다." + note,
            hypothesis=f"{top} drives yield; low-yield batches may also show pH excursion above 6.9.",
            hypothesis_ko=f"{top}가 yield를 좌우하며, 저수율 batch는 pH가 6.9를 초과하는 경향이 있을 수 있습니다.",
            confidence="medium",
            citations=[Citation(doc="CPP-CQA Matrix", section="CPP ↔ Product. Yield")],
            next_action=NextAction(type="re_analysis", tool="statistical_test",
                                   params={"feature": PH_FEATURE, "group_rule": "threshold", "threshold": 6.9},
                                   rationale="Test whether pH_BI > 6.9 batches show lower yield.",
                                   rationale_ko="pH_BI가 6.9를 넘는 batch에서 yield가 낮아지는지 검정합니다."),
        )
    if iteration == 2 and not is_last:
        p = (evidence.evidence or {}).get("p_value")
        supports = p is not None and p < 0.05
        return MsatResult(
            iteration=iteration,
            interpretation=f"Group test {'supports' if supports else 'is inconclusive on'} the pH hypothesis (p={p})." + note,
            interpretation_ko=f"그룹 검정 결과 pH 가설을 {'뒷받침합니다' if supports else '확정하기 어렵습니다'} (p={p})." + note,
            hypothesis="High pH combined with glucose over-feeding concentrates yield loss.",
            hypothesis_ko="높은 pH와 glucose over-feeding이 겹칠 때 yield 손실이 집중됩니다.",
            confidence="high" if supports else "medium",
            citations=[Citation(doc="Troubleshooting Guide", section="over-feeding → pH drift")],
            next_action=NextAction(type="re_analysis", tool="correlation_analysis",
                                   params={"method": "spearman"},
                                   rationale="Quantify pH and glucose correlation with yield.",
                                   rationale_ko="pH·glucose와 yield의 상관을 정량화합니다."),
        )
    return MsatResult(
        iteration=iteration,
        interpretation="Evidence is consistent across SHAP, group test, and correlation." + note,
        interpretation_ko="SHAP·그룹 검정·상관분석 결과가 서로 일관됩니다." + note,
        hypothesis=("Golden Batch window: keep pH_BI 6.7–6.9, avoid glucose over-feeding, maintain "
                    "high VCD_BI with a strong O2 supply ramp."),
        hypothesis_ko=("Golden Batch 구간: pH_BI 6.7–6.9 유지, glucose over-feeding 회피, 높은 VCD_BI와 "
                       "강한 O2 supply ramp 유지."),
        confidence="high",
        citations=[Citation(doc="Golden Batch Criteria", section="Parameter windows")],
        next_action=NextAction(type="stop", rationale="Hypothesis confirmed across methods.",
                               rationale_ko="여러 기법에서 가설이 일관되게 확인되었습니다."),
    )
