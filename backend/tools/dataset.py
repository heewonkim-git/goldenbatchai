"""Dataset loading + preprocessing for the Analysis Agent (PRD §6.0 step 0).

Mirrors the lecture pipeline: numeric selection, label-encode categoricals,
inf -> NaN, median impute. Also excludes the batch id and leakage/downstream
columns so USP-yield analysis does not cheat with DSP outcomes.
"""
from __future__ import annotations

import re
import uuid
from io import StringIO
from pathlib import Path

import numpy as np
import pandas as pd

from config import settings

SEED_CSV = settings.data_dir / "golden_batch_demo.csv"

# In-memory uploaded datasets (demo only; not persisted across restarts).
UPLOADS: dict[str, pd.DataFrame] = {}

ID_COLS = {"Batch_No"}

# Targets the model must never see as features.
ALL_TARGETS = {
    "[harvest][Harvest] Product. Yield",
    "DSP_Final_Protein (g)",
}

# Downstream / proxy columns that leak the USP yield answer (generated as
# near-deterministic functions of it): DSP chromatography load/pool + titer proxy.
LEAKAGE_MARKERS = ("CEO ", "AEO ", "DSP_")
PROXY_COLS = {"Normalized Titer by 1000"}


def load_dataset(dataset: str = "seed") -> pd.DataFrame:
    """Load a dataset by id: the bundled seed CSV, an uploaded id, or a path."""
    if dataset == "seed":
        path = SEED_CSV
    elif dataset in UPLOADS:
        return UPLOADS[dataset]
    else:
        path = Path(dataset)
    if not path.exists():
        raise FileNotFoundError(f"dataset not found: {path}")
    return pd.read_csv(path)


def register_upload(csv_text: str, name: str | None = None) -> tuple[str, pd.DataFrame]:
    """Parse pasted/uploaded CSV text, keep it in memory, return (id, df)."""
    df = pd.read_csv(StringIO(csv_text))
    if df.empty or len(df.columns) < 2:
        raise ValueError("CSV must have at least 2 columns and 1 row.")
    ds_id = "up_" + uuid.uuid4().hex[:8]
    UPLOADS[ds_id] = df
    return ds_id, df


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def target_candidates(df: pd.DataFrame) -> list[str]:
    """Columns that look like an outcome (yield / protein / titer), else all numerics."""
    hits = [c for c in df.columns
            if any(k in c.lower() for k in ("yield", "protein", "titer", "titre"))]
    if hits:
        return hits
    return [c for c in df.columns if df[c].dtype.kind in "fi"] or list(df.columns)


def resolve_target(df: pd.DataFrame, target: str) -> str:
    """Best-effort match of a requested target to a real column.

    Tolerates frontend/dataset naming drift (e.g. a missing ``[Harvest]`` substage)
    so a slightly-off target name does not crash the run.
    """
    if target in df.columns:
        return target
    t = _norm(target)
    for c in df.columns:                       # normalized exact
        if _norm(c) == t:
            return c
    subset = [c for c in df.columns if t and (t in _norm(c) or _norm(c) in t)]
    if subset:
        return min(subset, key=len)            # closest / least-padded match
    cands = target_candidates(df)              # last resort: an outcome-looking column
    if cands:
        return cands[0]
    raise ValueError(
        f"target {target!r} not found. Available columns: {', '.join(map(str, df.columns[:20]))}"
    )


def feature_columns(df: pd.DataFrame, target: str) -> list[str]:
    """Numeric feature columns for `target`, excluding id / targets / leakage."""
    cols: list[str] = []
    for c in df.columns:
        if c == target or c in ID_COLS or c in ALL_TARGETS or c in PROXY_COLS:
            continue
        if c.startswith(LEAKAGE_MARKERS):  # DSP downstream of USP yield
            continue
        cols.append(c)
    return cols


def prepare_xy(df: pd.DataFrame, target: str) -> tuple[pd.DataFrame, pd.Series]:
    """Return cleaned (X, y): label-encoded, inf->NaN, median-imputed, numeric."""
    if target not in df.columns:
        raise ValueError(f"target column not found: {target!r}")

    feats = feature_columns(df, target)
    X = df[feats].copy()

    for col in X.select_dtypes(include=["category", "object"]).columns:
        X[col] = X[col].astype("category").cat.codes

    X = X.apply(pd.to_numeric, errors="coerce")
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.fillna(X.median(numeric_only=True))
    # Drop any column still all-NaN (no signal) to keep models happy.
    X = X.dropna(axis=1, how="all")

    y = pd.to_numeric(df[target], errors="coerce")
    return X, y
