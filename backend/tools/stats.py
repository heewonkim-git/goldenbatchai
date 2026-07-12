"""Statistical tools for the Analysis Agent (PRD §6). Quantitative evidence only."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from scipy import stats


def statistical_test(df: pd.DataFrame, target: str, feature: str,
                     group_rule: str = "median_split", threshold: float | None = None,
                     alpha: float = 0.05) -> dict[str, Any]:
    """Welch t-test comparing target across a two-way split of `feature`.

    group_rule: "median_split" (default) or "threshold" (uses `threshold`, high = feature > threshold).
    """
    if feature not in df.columns:
        raise ValueError(f"feature not found: {feature!r}")
    d = df[[feature, target]].apply(pd.to_numeric, errors="coerce").dropna()

    if group_rule == "threshold" and threshold is not None:
        cut = float(threshold)
        rule_desc = f"{feature} > {cut}"
    else:
        cut = float(d[feature].median())
        rule_desc = f"{feature} > median({cut:.4g})"

    hi = d[d[feature] > cut][target]
    lo = d[d[feature] <= cut][target]
    t, p = stats.ttest_ind(hi, lo, equal_var=False)
    return {
        "feature": feature,
        "target": target,
        "test": "welch_t",
        "group_rule": rule_desc,
        "statistic": round(float(t), 4),
        "p_value": round(float(p), 5),
        "alpha": alpha,
        "significant": bool(float(p) < alpha),
        "groups": {
            "high": {"n": int(len(hi)), "mean": round(float(hi.mean()), 3), "std": round(float(hi.std()), 3)},
            "low": {"n": int(len(lo)), "mean": round(float(lo.mean()), 3), "std": round(float(lo.std()), 3)},
        },
    }


def correlation_analysis(df: pd.DataFrame, target: str, features: list[str],
                         method: str = "spearman", alpha: float = 0.05) -> dict[str, Any]:
    """Correlation of each feature with the target (+ p-value), ranked by |rho|."""
    d = df[[*features, target]].apply(pd.to_numeric, errors="coerce").dropna()
    fn = stats.spearmanr if method == "spearman" else stats.pearsonr
    rows = []
    for f in features:
        if f not in d.columns or d[f].std() == 0:
            continue
        r, p = fn(d[f], d[target])
        rows.append({"feature": f, "r": round(float(r), 4), "p_value": round(float(p), 5)})
    rows.sort(key=lambda x: abs(x["r"]), reverse=True)

    # scatter sample for the strongest-correlated feature (feature vs target)
    scatter = None
    if rows:
        f = rows[0]["feature"]
        pts = [[round(float(x), 4), round(float(yv), 4)]
               for x, yv in zip(d[f].tolist(), d[target].tolist())]
        scatter = {
            "feature": f,
            "target": target,
            "r": rows[0]["r"],
            "r2": round(float(rows[0]["r"]) ** 2, 4),
            "points": pts[:200],
        }

    return {
        "target": target,
        "method": method,
        "alpha": alpha,
        "n_samples": int(len(d)),
        "correlations": rows,
        "significant": [x for x in rows if x["p_value"] < alpha],
        "scatter": scatter,
    }
