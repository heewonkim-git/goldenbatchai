"""Real ML tools for the Analysis Agent (PRD §6). Quantitative evidence only.

Productizes the lecture pipeline (Lecture7 AutoML, Lecture10 SHAP / feature
selection / model comparison / collinearity) on the prepared (X, y).

NOTE: real column names contain '[', ']' which XGBoost/LightGBM reject as feature
names, so models are fit on numpy arrays and columns are mapped back by position.
"""
from __future__ import annotations

import warnings
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.feature_selection import mutual_info_regression
from sklearn.linear_model import LassoCV
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# Canonical model list + default hyperparameters. Also served to the Settings UI
# (GET /api/analysis-defaults) so the form and the real estimators never drift.
# `max_depth: 0` means "no limit" (mapped to None where the estimator expects it).
MODEL_DEFAULTS: dict[str, dict[str, Any]] = {
    "RandomForest": {"n_estimators": 200, "max_depth": 0, "min_samples_split": 2},
    "GradientBoosting": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3},
    "XGBoost": {"n_estimators": 100, "learning_rate": 0.3, "max_depth": 6, "subsample": 1.0},
    "LightGBM": {"n_estimators": 100, "learning_rate": 0.1, "num_leaves": 31},
}


def _get(cfg, name: str, default):
    return getattr(cfg, name, default) if cfg is not None else default


def _kfold(cfg) -> KFold:
    return KFold(n_splits=int(_get(cfg, "cv_folds", 5)), shuffle=True,
                 random_state=int(_get(cfg, "random_state", 42)))


def _xgb(rs: int = 42, **kw):
    from xgboost import XGBRegressor

    return XGBRegressor(random_state=rs, n_jobs=-1, verbosity=0, **kw)


def _lgb(rs: int = 42, **kw):
    from lightgbm import LGBMRegressor

    return LGBMRegressor(random_state=rs, n_jobs=-1, verbose=-1, **kw)


def _make(name: str, p: dict[str, Any], rs: int):
    if name == "RandomForest":
        md = p.get("max_depth", 0)
        return RandomForestRegressor(
            n_estimators=int(p.get("n_estimators", 200)),
            max_depth=None if not md else int(md),
            min_samples_split=int(p.get("min_samples_split", 2)),
            random_state=rs, n_jobs=-1)
    if name == "GradientBoosting":
        return GradientBoostingRegressor(
            n_estimators=int(p.get("n_estimators", 100)),
            learning_rate=float(p.get("learning_rate", 0.1)),
            max_depth=int(p.get("max_depth", 3)), random_state=rs)
    if name == "XGBoost":
        return _xgb(rs, n_estimators=int(p.get("n_estimators", 100)),
                    learning_rate=float(p.get("learning_rate", 0.3)),
                    max_depth=int(p.get("max_depth", 6)),
                    subsample=float(p.get("subsample", 1.0)))
    if name == "LightGBM":
        return _lgb(rs, n_estimators=int(p.get("n_estimators", 100)),
                    learning_rate=float(p.get("learning_rate", 0.1)),
                    num_leaves=int(p.get("num_leaves", 31)))
    raise ValueError(f"unknown model {name!r}")


def _models(cfg=None) -> dict[str, Any]:
    """Build the enabled estimators, merging user params over the defaults."""
    rs = int(_get(cfg, "random_state", 42))
    user = _get(cfg, "models", {}) or {}
    out: dict[str, Any] = {}
    for name, defaults in MODEL_DEFAULTS.items():
        mc = user.get(name)
        enabled = getattr(mc, "enabled", True) if mc is not None else True
        if not enabled:
            continue
        params = {**defaults, **(getattr(mc, "params", {}) or {} if mc is not None else {})}
        out[name] = _make(name, params, rs)
    if not out:  # never leave the leaderboard empty
        out["XGBoost"] = _make("XGBoost", MODEL_DEFAULTS["XGBoost"], rs)
    return out


def _np(X: pd.DataFrame, y: pd.Series):
    return X.values, np.asarray(y, dtype=float), list(X.columns)


def _cv_scores(model, Xv, y, cv) -> tuple[float, float, float]:
    rmse = np.sqrt(-cross_val_score(model, Xv, y, scoring="neg_mean_squared_error", cv=cv))
    r2 = cross_val_score(model, Xv, y, scoring="r2", cv=cv)
    return float(rmse.mean()), float(rmse.std()), float(r2.mean())


# --- automl (sklearn model leaderboard, in lieu of AutoGluon) ----------------

def automl(X: pd.DataFrame, y: pd.Series, cfg=None) -> dict[str, Any]:
    Xv, yv, _ = _np(X, y)
    cv = _kfold(cfg)
    board = []
    for name, model in _models(cfg).items():
        rmse_m, rmse_s, r2 = _cv_scores(model, Xv, yv, cv)
        board.append({"model": name, "rmse": round(rmse_m, 3), "rmse_std": round(rmse_s, 3), "r2": round(r2, 3)})
    board.sort(key=lambda d: d["rmse"])
    best = board[0]
    return {
        "framework": "sklearn-leaderboard",
        "n_samples": int(len(yv)),
        "n_features_in": int(X.shape[1]),
        "cv_folds": cv.get_n_splits(),
        "leaderboard": board,
        "best_model": best["model"],
        "test_metrics": {"rmse": best["rmse"], "r2": best["r2"]},
    }


# --- collinearity ------------------------------------------------------------

def remove_multicollinearity(X: pd.DataFrame, threshold: float = 0.9) -> dict[str, Any]:
    corr = X.corr(method="spearman").abs()
    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
    to_drop = [c for c in upper.columns if (upper[c] > threshold).any()]
    return {
        "threshold": threshold,
        "dropped": to_drop,
        "n_dropped": len(to_drop),
        "n_remaining": int(X.shape[1] - len(to_drop)),
    }


# --- SHAP --------------------------------------------------------------------

def shap_analysis(X: pd.DataFrame, y: pd.Series, model: str = "xgboost", runs: int = 3,
                  top_k: int = 12, cfg=None) -> dict[str, Any]:
    import shap

    Xv, yv, cols = _np(X, y)
    runs = int(_get(cfg, "shap_runs", runs))
    test_size = float(_get(cfg, "test_size", 0.2))
    rs0 = int(_get(cfg, "random_state", 0))
    make = _xgb if model == "xgboost" else _lgb
    abs_runs = np.zeros((runs, len(cols)))
    dir_accum = np.zeros(len(cols))
    base_vals: list[float] = []

    for run in range(runs):
        Xtr, Xva, ytr, _ = train_test_split(Xv, yv, test_size=test_size, random_state=rs0 + run)
        est = make()
        est.fit(Xtr, ytr)
        expl = shap.TreeExplainer(est)
        sv = np.asarray(expl.shap_values(Xva))
        abs_runs[run] = np.abs(sv).mean(axis=0)
        for j in range(len(cols)):
            if np.std(Xva[:, j]) > 0 and np.std(sv[:, j]) > 0:
                dir_accum[j] += np.corrcoef(Xva[:, j], sv[:, j])[0, 1]
        base_vals.append(float(np.ravel(expl.expected_value)[0]))

    mean_abs = abs_runs.mean(axis=0)
    std_abs = abs_runs.std(axis=0)
    order = np.argsort(mean_abs)[::-1][:top_k]
    top = [
        {
            "feature": cols[j],
            "mean_abs_shap": round(float(mean_abs[j]), 4),
            "shap_std": round(float(std_abs[j]), 4),
            "direction": "positive" if dir_accum[j] >= 0 else "negative",
        }
        for j in order
    ]
    return {
        "model": model,
        "shap_runs": runs,
        "n_samples": int(len(yv)),
        "base_value": round(float(np.mean(base_vals)), 3),
        "top_features": top,
    }


# --- model comparison (RMSE + per-model SHAP top) ----------------------------

def model_compare(X: pd.DataFrame, y: pd.Series, top_k: int = 6, cfg=None) -> dict[str, Any]:
    import shap

    Xv, yv, cols = _np(X, y)
    cv = _kfold(cfg)
    out = []
    for name, model in _models(cfg).items():
        rmse_m, rmse_s, r2 = _cv_scores(model, Xv, yv, cv)
        top: list[dict] = []
        try:
            model.fit(Xv, yv)
            sv = np.asarray(shap.TreeExplainer(model).shap_values(Xv))
            imp = np.abs(sv).mean(axis=0)
            for j in np.argsort(imp)[::-1][:top_k]:
                top.append({"feature": cols[j], "mean_abs_shap": round(float(imp[j]), 4)})
        except Exception:
            top = []
        out.append({"model": name, "rmse": round(rmse_m, 3), "rmse_std": round(rmse_s, 3),
                    "r2": round(r2, 3), "top_features": top})
    out.sort(key=lambda d: d["rmse"])
    return {"n_samples": int(len(yv)), "models": out}


# --- feature selection ensemble ----------------------------------------------

def _shap_rank(Xv, yv, cols, make, num: int) -> list[str]:
    import shap

    est = make()
    est.fit(Xv, yv)
    sv = np.asarray(shap.TreeExplainer(est).shap_values(Xv))
    imp = np.abs(sv).mean(axis=0)
    return [cols[j] for j in np.argsort(imp)[::-1][:num]]


def _rank_from_scores(scores, cols, num: int) -> list[str]:
    return [cols[j] for j in np.argsort(scores)[::-1][:num]]


def feature_selection(X: pd.DataFrame, y: pd.Series, num_selected: int = 15, cfg=None) -> dict[str, Any]:
    Xv, yv, cols = _np(X, y)
    num_selected = int(_get(cfg, "num_selected", num_selected))
    num_selected = min(num_selected, len(cols))
    rs = int(_get(cfg, "random_state", 42))
    folds = int(_get(cfg, "cv_folds", 5))
    Xs = StandardScaler().fit_transform(Xv)

    lasso = LassoCV(cv=folds, random_state=rs, max_iter=5000).fit(Xs, yv)
    mi = mutual_info_regression(Xs, yv, random_state=rs)

    by_method: dict[str, list[str]] = {
        "shap_xgb": _shap_rank(Xv, yv, cols, _xgb, num_selected),
        "shap_lgb": _shap_rank(Xv, yv, cols, _lgb, num_selected),
        "lasso": _rank_from_scores(np.abs(lasso.coef_), cols, num_selected),
        "mutual_info": _rank_from_scores(mi, cols, num_selected),
    }

    weights = {"shap_xgb": 2, "shap_lgb": 2, "lasso": 1, "mutual_info": 1}
    scores: dict[str, float] = {}
    hits: dict[str, int] = {}
    for method, feats in by_method.items():
        w = weights[method]
        for pos, f in enumerate(feats):
            scores[f] = scores.get(f, 0.0) + w * (num_selected - pos)
            hits[f] = hits.get(f, 0) + 1
    aggregated = sorted(scores, key=lambda f: scores[f], reverse=True)[:num_selected]
    aggregated_rank = [
        {"feature": f, "score": round(scores[f], 1), "methods_hit": hits[f]} for f in aggregated
    ]

    def ov(a: str, b: str) -> int:
        return len(set(by_method[a]) & set(by_method[b]))

    return {
        "num_selected": num_selected,
        "methods": list(by_method.keys()),
        "by_method": by_method,
        "aggregated_rank": aggregated_rank,
        "overlap": {
            "shap_and_mi": ov("shap_xgb", "mutual_info"),
            "shap_and_lasso": ov("shap_xgb", "lasso"),
            "shap_xgb_and_lgb": ov("shap_xgb", "shap_lgb"),
        },
    }
