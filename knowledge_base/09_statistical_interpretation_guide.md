# Statistical Interpretation Guide — From Model Output to Process Decisions

**Document ID:** PTD-09 | **Revision:** 2.4 | **Effective:** 2026-04-15
**Audience:** MSAT reviewers and the Golden Batch Multi-Agent MSAT Agent.

## 1. Purpose

This guide explains how to translate the machine-learning / statistical outputs used in the Golden Batch application into process decisions, and how to avoid common misinterpretations. It connects model evidence to the CPP↔CQA framework (PTD-03) and the caution that models provide evidence, not proof of causation.

## 2. Reading SHAP Rankings

The yield model reports mean |SHAP| values that rank features by their average contribution to predicted `Product. Yield`. Interpretation:

- A **high** mean |SHAP| means the feature moves predicted yield strongly and consistently. For this process, `[prd_final]VCD_BI` is expected to top the ranking, followed by `[Production]O2_supply_slope`, seed `125mL_Final Viability`, `[prd_final]pH_BI`, `[media_prep][media][Media B] Osmo`, and `[Production]Temp_Drop_Time_hr`.
- SHAP shows **magnitude and direction locally** but not shape by itself. Use dependence plots to see nonlinearity: `pH_BI` shows a **threshold** (loss above 6.9); `Media B Osmo` shows a **U-shape** (loss away from ~310); `Temp_Drop_Time_hr` is **monotonic negative**.
- A noise feature (pCO2_BI, NH4+_BI, Gln_BI, centrifuge speed, filter DP, air-flow means) occasionally receives non-zero SHAP from chance structure. Rank it against PTD-03; if it is Low-criticality, do not elevate it to a root cause.

## 3. Group Differences and p-values

For categorical comparisons (e.g., pH_BI > 6.9 vs ≤ 6.9), a Welch t-test is used. The planted, confirmed finding: the high-pH group averages ~71.5 g vs ~78.3 g for the in-range group, p ≈ 0.003. A p-value < 0.05 indicates the difference is unlikely to be chance, supporting a real effect. p-values quantify evidence against the null; they do not measure effect size — always report the group means alongside.

## 4. Model Fit — CV RMSE

Model quality is reported as cross-validated RMSE on `Product. Yield` (which has std ~10 g). A CV RMSE meaningfully below the outcome std indicates the model captures real signal; an RMSE near the std indicates weak predictive value and rankings should be treated cautiously. Always use cross-validated (not training) error to avoid over-optimism.

## 5. Multicollinearity — Why Redundant Features Are Dropped

When two features carry the same information, a model may split credit between them arbitrarily, distorting rankings. We remove one of each strongly collinear pair (Spearman > 0.9) before ranking:

- `[Production]O2_supply_sum` ~ `[Production]O2_supply_slope` — keep slope.
- `[prd_final]Via_BI` ~ seed `125mL_Final Viability` — treat as one signal.
- `[prd_final]Normalized Titer by 1000_BI` ~ `[prd_final]VCD_BI` — keep VCD.

If a "surprising" feature appears important, first check whether it is a proxy for one of these.

## 6. Evidence, Not Causation — SME Confirmation

Machine learning identifies **associations**. A feature ranking high is a hypothesis about a driver, to be confirmed against process understanding (PTD-02/03/07) and, ideally, controlled study. The MSAT Agent should:

1. Cite the ranked driver(s) and their direction/shape.
2. Cross-check against PTD-03 criticality and PTD-07 SME heuristics.
3. Decline to attribute causation to a Low-criticality/noise feature even if it ranks non-zero.
4. State group means and p-values when making a difference claim.

This discipline keeps the app's conclusions consistent with the known ground truth and defensible to reviewers.
