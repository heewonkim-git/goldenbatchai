"""Generate the reproducible seed dataset for the Golden Batch demo.

Design goal (PRD §5.3, §6): a batch x feature table that follows the REAL column
naming convention (PRD Appendix C) and carries a *planted causal structure* so
that the Analysis Agent's real ML (AutoML / SHAP / stats) recovers a known ground
truth. That lets the SHAP output, the KB documents, and the demo narrative stay
perfectly consistent and 100% reproducible.

Ground truth (drivers of USP harvest yield — see data/GROUND_TRUTH.md):
  + VCD_BI                 higher peak viable cell density -> more product
  + O2_supply_slope        stronger oxygen delivery ramp   -> more product
  + seed Final Viability   healthier seed                  -> more product
  - pH_BI above 6.9        production pH excursion          -> yield loss
  - Media B Osmo extremes  osmolality far from target       -> yield loss (U-shape)
  - Temp_Drop_Time_hr late temperature shift                -> yield loss
  x (pH>6.9) & high Glucose (over-feeding)                  -> extra yield loss

Run:  python data/generate_seed.py       (writes data/golden_batch_demo.csv)
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N = 120  # batches

HERE = Path(__file__).resolve().parent
OUT = HERE / "golden_batch_demo.csv"


def z(x: np.ndarray) -> np.ndarray:
    return (x - x.mean()) / (x.std() + 1e-9)


def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0.0)


def main() -> None:
    df = pd.DataFrame()
    df["Batch_No"] = [f"B{2400 + i:04d}" for i in range(N)]

    # ---- USP: seed flask ----
    flask_via = RNG.normal(96.0, 2.2, N).clip(85, 99.5)        # % viability (driver)
    df["[flask_filtered][flask]125mL_Final VCD"] = RNG.normal(6.5, 1.1, N).clip(3, 10)
    df["[flask_filtered][flask]125mL_Final Viability"] = flask_via
    df["[flask_filtered][flask]125mL_Initial VCD"] = RNG.normal(0.4, 0.06, N).clip(0.2, 0.7)
    df["[flask_filtered][flask]CellAge_weighted"] = RNG.normal(12.0, 2.5, N).clip(5, 20)

    # ---- USP: media prep ----
    mediaB_osmo = RNG.normal(310.0, 18.0, N).clip(260, 360)     # driver (U-shape)
    df["[media_prep][media][Media_A] Glucose_Conc"] = RNG.normal(6.0, 0.8, N).clip(3, 9)
    df["[media_prep][media][Media_A] Osmo"] = RNG.normal(300.0, 12.0, N).clip(270, 340)
    df["[media_prep][media][Media_A] pH-Final"] = RNG.normal(7.0, 0.08, N).clip(6.7, 7.3)
    gluc_B = RNG.normal(7.0, 1.4, N).clip(3.5, 12)              # over-feeding driver
    df["[media_prep][media][Media B] Glucose_Conc"] = gluc_B
    df["[media_prep][media][Media B] Osmo"] = mediaB_osmo
    df["[media_prep][media][Media B] pH-Final"] = RNG.normal(7.05, 0.09, N).clip(6.7, 7.4)
    df["[media_prep][media][Media C] Osmo"] = RNG.normal(305.0, 14.0, N).clip(270, 350)

    # ---- USP: production bioreactor (batch summary) ----
    vcd_bi = RNG.normal(14.0, 2.6, N).clip(7, 22)              # PRIMARY driver
    df["[prd_final]VCD_BI"] = vcd_bi
    # Via_BI is partly redundant with seed viability (multicollinearity to remove)
    df["[prd_final]Via_BI"] = (0.6 * z(flask_via) * 1.5 + 92 + RNG.normal(0, 1.0, N)).clip(80, 99)
    ph_bi = RNG.normal(6.85, 0.12, N).clip(6.5, 7.25)         # driver (penalty > 6.9)
    df["[prd_final]pH_BI"] = ph_bi
    df["[prd_final]pCO2_BI"] = RNG.normal(55.0, 8.0, N).clip(30, 90)          # noise
    df["[prd_final]Gln_BI"] = RNG.normal(4.5, 1.0, N).clip(1, 8)             # noise
    df["[prd_final]NH4+_BI"] = RNG.normal(3.2, 0.7, N).clip(1, 6)            # noise
    df["[prd_final]Osm_0"] = RNG.normal(320.0, 15.0, N).clip(280, 370)       # weak
    df["[prd_final]Reactor Fill Level_BI"] = RNG.normal(78.0, 4.0, N).clip(65, 90)  # noise
    df["[prd_final]Age_BI"] = RNG.normal(0.0, 1.0, N)                        # noise
    # Titer_BI correlates with VCD (redundant-ish)
    df["[prd_final]Normalized Titer by 1000_BI"] = (0.7 * z(vcd_bi) + RNG.normal(0, 0.6, N))

    # ---- USP: production signals (time-series summaries) ----
    df["[Production]DO_Stab_Avg"] = RNG.normal(40.0, 4.0, N).clip(25, 55)
    df["[Production]DO_Stab_Std"] = RNG.normal(3.0, 0.8, N).clip(0.5, 6)
    df["[Production]DO_StabTime_hr"] = RNG.normal(6.0, 1.5, N).clip(2, 12)
    o2_slope = RNG.normal(0.0, 1.0, N)                         # driver (standardized)
    df["[Production]O2_supply_slope"] = o2_slope
    df["[Production]O2_supply_max"] = RNG.normal(2.4, 0.5, N).clip(1, 4)
    # O2_supply_sum redundant with slope (multicollinearity to remove)
    df["[Production]O2_supply_sum"] = 0.85 * o2_slope + RNG.normal(0, 0.4, N)
    df["[Production]Temp_First"] = RNG.normal(37.0, 0.2, N).clip(36.2, 37.6)
    tdrop = RNG.normal(96.0, 12.0, N).clip(60, 140)           # driver (later = worse)
    df["[Production]Temp_Drop_Time_hr"] = tdrop
    df["[Production]Top_Air_Flow_mean"] = RNG.normal(1.5, 0.3, N).clip(0.5, 3)     # noise
    df["[Production]Bottom_Air_Flow_mean"] = RNG.normal(0.8, 0.2, N).clip(0.2, 2)  # noise

    # ---- USP: harvest ----
    df["[harvest]Centrifuge_Bowl_Speed_mean"] = RNG.normal(9500, 400, N).clip(8000, 11000)
    df["[harvest]Centrifuge_FeedFlowRate_mean"] = RNG.normal(120, 12, N).clip(80, 160)
    df["[harvest]Diff_Press_Final_Filter_mean"] = RNG.normal(0.9, 0.15, N).clip(0.4, 1.6)
    df["[harvest]Diff_Press_Final_Filter_std"] = RNG.normal(0.12, 0.03, N).clip(0.02, 0.3)

    # ---- Ground-truth USP harvest yield (g) ----
    high_ph = (ph_bi > 6.9).astype(float)
    yield_g = (
        80.0
        + 6.0 * z(vcd_bi)
        + 4.0 * o2_slope
        + 3.0 * z(flask_via)
        - 5.0 * relu(ph_bi - 6.9) * 10.0
        - 3.0 * (z(mediaB_osmo) ** 2)
        - 2.5 * z(tdrop)
        - 4.0 * high_ph * relu(z(gluc_B))       # over-feeding x high pH interaction
        + RNG.normal(0.0, 3.0, N)
    )
    df["[harvest][Harvest] Product. Yield"] = yield_g.round(2)

    # Titer (CQA reference) tracks yield
    df["Normalized Titer by 1000"] = (0.05 * yield_g + RNG.normal(0, 0.25, N)).round(3)

    # ---- DSP (downstream): recovery applies to USP product ----
    ceo_load = (yield_g * RNG.uniform(0.92, 0.98, N))          # near USP product
    df["CEO Load Protein (g)"] = ceo_load.round(2)
    df["CEO Load Cond (mS/cm)"] = RNG.normal(12.0, 1.5, N).clip(7, 18)
    aeo_load_conc = RNG.normal(8.0, 1.0, N).clip(4, 12)
    df["AEO Load Conc. (g/L)"] = aeo_load_conc.round(2)
    aeo_hold = RNG.normal(4.0, 1.2, N).clip(1, 8)
    df["AEO Hold Time (hr)"] = aeo_hold.round(2)
    # DSP recovery weakly depends on load conductivity + hold time (DSP's own knobs)
    recovery = (0.88 - 0.01 * z(df["CEO Load Cond (mS/cm)"].values)
                - 0.008 * z(aeo_hold)).clip(0.75, 0.95)
    aeo_pool = ceo_load * recovery
    df["AEO Pool Prot (g)"] = aeo_pool.round(2)
    df["DSP_Final_Protein (g)"] = (aeo_pool * RNG.uniform(0.97, 0.995, N)).round(2)

    df.to_csv(OUT, index=False)
    print(f"wrote {OUT}  shape={df.shape}")
    print("yield: mean=%.1f std=%.1f min=%.1f max=%.1f"
          % (yield_g.mean(), yield_g.std(), yield_g.min(), yield_g.max()))


if __name__ == "__main__":
    main()
