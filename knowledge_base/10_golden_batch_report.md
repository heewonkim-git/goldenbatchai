# Golden Batch Analysis Report — Recommended Golden Window

**Document ID:** PTD-10 | **Revision:** 1.5 | **Prepared by:** MSAT | **Date:** 2026-05-06
**Reference dataset:** Campaigns 24-A through 25-C. Outcome: `[harvest][Harvest] Product. Yield` (mean ~76.5 g, std ~10, range ~47–99 g).

## 1. Executive Summary

Multivariate analysis of the historical campaign data identifies a reproducible "golden window" of upstream parameters that delivers top-tier USP harvest yield (≥ 85 g). The recommended window and its evidentiary basis are summarized below. This report is the exemplar conclusion the Golden Batch Multi-Agent application should reach and cite.

## 2. Recommended Golden Window

| Driver | Recommended target | Criticality | Evidence |
|---|---|---|---|
| `[prd_final]VCD_BI` | High (≥ 24 ×10^6 cells/mL) | High | Top mean |SHAP|; primary positive driver |
| `[Production]O2_supply_slope` | Steep / top-quartile | High | Positive SHAP; steep ramp in all golden batches |
| `[flask_filtered][flask]125mL_Final Viability` | ≥ 95 % | High | Positive; healthy seed → high VCD |
| `[prd_final]pH_BI` | 6.7 – 6.9 (never > 6.9) | High | Threshold loss above 6.9 (see §4) |
| `[media_prep][media][Media B] Osmo` | ~310 (±10) mOsm/kg | High | U-shaped optimum near 310 |
| `[Production]Temp_Drop_Time_hr` | Early (≤ 60 hr) | High | Monotonic negative; earlier shift → higher yield |
| `[media_prep][media][Media B] Glucose_Conc` | 4.0 – 5.5 g/L | Medium | Over-feeding drives pH drift (interaction) |

## 3. Ranked Drivers (mean |SHAP|, yield model)

1. `[prd_final]VCD_BI` — strongest, positive.
2. `[Production]O2_supply_slope` — positive.
3. `[flask_filtered][flask]125mL_Final Viability` — positive.
4. `[prd_final]pH_BI` — negative above 6.9.
5. `[media_prep][media][Media B] Osmo` — U-shaped.
6. `[Production]Temp_Drop_Time_hr` — negative (later worse).

Collinear proxies (`O2_supply_sum`, `Via_BI`, `Normalized Titer by 1000_BI`) were pruned per PTD-09. Noise parameters (pCO2_BI, NH4+_BI, Gln_BI, centrifuge speed, filter DP, air-flow means) ranked low and are not part of the golden window.

## 4. Key Statistical Findings

- **pH threshold:** batches with `pH_BI` > 6.9 averaged ~71.5 g vs ~78.3 g for ≤ 6.9 (Welch t-test, p ≈ 0.003). Hold pH at or below the 6.9 ceiling.
- **Osmolality valley:** yield peaks near 310 mOsm/kg and declines for both high and low deviations (e.g., B2418 at 284 and B2506 at 331 both underperformed).
- **Temp-shift timing:** golden batches shifted at 50–58 hr; late shifts (66–70 hr) accompanied low yield.
- **Interaction:** high pH combined with glucose over-feeding produces excess loss beyond either factor alone (B2412).

## 5. Exemplar Batch

**B2401 (92.4 g)** realizes the full golden window: seed viability 97 %, VCD_BI 27.1, pH_BI 6.82, Media B Osmo 308, Temp_Drop_Time 54 hr, steep O2_supply_slope. It is the recommended reference profile.

## 6. Recommendation

Target the golden window on every batch, prioritizing the High-criticality drivers. Treat a pH excursion above 6.9, off-target osmolality, or a late temperature shift as the first-line hypotheses for any yield shortfall. Confirm all model-derived conclusions against SME process knowledge (PTD-07) and the CPP↔CQA matrix (PTD-03) before acting — the model provides evidence, not proof of causation.
