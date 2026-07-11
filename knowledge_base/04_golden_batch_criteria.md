# Golden Batch Definition and Acceptance Criteria

**Document ID:** PTD-04 | **Revision:** 3.7 | **Effective:** 2026-01-08

## 1. Purpose

A "golden batch" is a reference batch that achieves top-tier yield while remaining inside all defined parameter windows and passing all quality checks. This document defines the acceptance thresholds and the parameter windows a batch must satisfy to qualify. It is used as the target profile in the Golden Batch Multi-Agent application.

## 2. Outcome Acceptance Thresholds

USP harvest yield (`[harvest][Harvest] Product. Yield`) across the historical dataset has mean ~76.5 g (std ~10, range ~47–99 g). Tiering:

| Tier | Product. Yield | Interpretation |
|---|---|---|
| **Golden** | ≥ 85 g | Top-tier; reference batch |
| Acceptable | 70 – 85 g | Meets plan |
| Investigate | < 70 g | Root-cause required |

Supporting outcome checks:
- `Normalized Titer by 1000` — at or above campaign median (trending up alongside VCD).
- `DSP_Final_Protein (g)` — DSP recovery within 0.75–0.95 of clarified harvest (DSP health, not USP yield).

## 3. Golden Parameter Windows

A golden batch stays within **all** of the following windows. These are consistent with PTD-02 and PTD-08.

| Parameter | Golden window | Rationale |
|---|---|---|
| `[prd_final]VCD_BI` | High end, ≥ 24 ×10^6 cells/mL | Primary positive yield driver |
| `[flask_filtered][flask]125mL_Final Viability` | ≥ 95 % | Healthy seed sets the trajectory |
| `[flask_filtered][flask]125mL_Final VCD` | 3.5 – 5.0 ×10^6 cells/mL | Strong inoculum |
| `[prd_final]pH_BI` | 6.7 – 6.9 (never > 6.9) | Above-6.9 excursion loses yield |
| `[media_prep][media][Media B] Osmo` | 310 ± 10 mOsm/kg | U-shaped optimum near 310 |
| `[media_prep][media][Media B] Glucose_Conc` | 4.0 – 5.5 g/L | Avoid over-feeding / pH drift |
| `[Production]O2_supply_slope` | Steep / positive (top quartile) | Stronger O2 delivery ramp → higher yield |
| `[Production]Temp_Drop_Time_hr` | Early (≤ 60 hr) | Earlier temp-shift → higher yield |
| `[Production]DO_Stab_Avg` | ~40 % (35–45) | Stable oxygenation |
| `[Production]DO_Stab_Std` | < 5 % | Tight DO control |

## 4. Rationale Summary

The golden profile is: **a healthy high-viability seed → high peak VCD → strong, early oxygen-delivery ramp → production pH held at or below the 6.9 ceiling → media osmolality near 310 → an early temperature shift.** Batches that hit this profile consistently land in the ≥ 85 g tier. The two most common ways a batch falls out of golden status are (1) a production pH excursion above 6.9 (often driven by glucose over-feeding) and (2) a late temperature shift; off-target Media B osmolality is the third. See PTD-05 for worked historical examples and PTD-06 for corrective actions.

## 5. Use in the Multi-Agent App

When the MSAT Agent evaluates a batch, it should compare the batch's parameters against these windows and cite the specific out-of-window driver(s) — ranked by criticality from PTD-03 — rather than noise parameters, when explaining a yield shortfall or confirming golden status.
