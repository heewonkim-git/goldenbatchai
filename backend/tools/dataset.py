"""Dataset loading + preprocessing for the Analysis Agent (PRD §6.0 step 0).

Mirrors the lecture pipeline: numeric selection, label-encode categoricals,
inf -> NaN, median impute. Also excludes the batch id and leakage/downstream
columns so USP-yield analysis does not cheat with DSP outcomes.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from config import settings

SEED_CSV = settings.data_dir / "golden_batch_demo.csv"

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
    """Load a dataset by id. M2: only the bundled seed CSV."""
    path = SEED_CSV if dataset == "seed" else Path(dataset)
    if not path.exists():
        raise FileNotFoundError(f"dataset not found: {path}")
    return pd.read_csv(path)


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
