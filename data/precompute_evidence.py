"""Precompute REAL Analysis evidence + RAG chunks for the Vercel (serverless) build.

The heavy ML (xgboost/lightgbm/shap) runs here once on the seed dataset; the
deployed Next.js API serves these cached-but-real results and calls Claude live.
Outputs:
  frontend/lib/seed-evidence.json   (per-tool evidence, quantitative only)
  frontend/lib/kb.json              (knowledge-base chunks for RAG)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from tools import dataset, ml, stats  # noqa: E402
from rag.store import store  # noqa: E402

TARGET = "[harvest][Harvest] Product. Yield"
OUT = ROOT / "frontend" / "lib"
OUT.mkdir(parents=True, exist_ok=True)

df = dataset.load_dataset("seed")
X, y = dataset.prepare_xy(df, TARGET)
print(f"data {df.shape}  features {X.shape[1]}")

evidence: dict = {
    "automl": ml.automl(X, y),
    "feature_selection": ml.feature_selection(X, y, num_selected=15),
    "shap_analysis": ml.shap_analysis(X, y, model="xgboost", runs=3),
    "model_compare": ml.model_compare(X, y),
    "remove_multicollinearity": ml.remove_multicollinearity(X, threshold=0.9),
    "correlation_analysis": stats.correlation_analysis(
        df, TARGET, dataset.feature_columns(df, TARGET), method="spearman"
    ),
}

# statistical_test variants keyed by "feature|rule|threshold"
stat: dict = {}
stat["[prd_final]pH_BI|threshold|6.9"] = stats.statistical_test(
    df, TARGET, "[prd_final]pH_BI", group_rule="threshold", threshold=6.9
)
for feat in [f["feature"] for f in evidence["shap_analysis"]["top_features"][:8]]:
    key = f"{feat}|median_split|"
    stat[key] = stats.statistical_test(df, TARGET, feat, group_rule="median_split")
evidence["statistical_test"] = stat

(OUT / "seed-evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=1), encoding="utf-8")
print("wrote seed-evidence.json  tools:", list(evidence.keys()),
      " stat keys:", len(stat))

# RAG chunks
store.ingest()
chunks = [{"doc": c.doc, "section": c.section, "text": c.text} for c in store._chunks]
(OUT / "kb.json").write_text(json.dumps(chunks, ensure_ascii=False), encoding="utf-8")
print(f"wrote kb.json  chunks: {len(chunks)}")
