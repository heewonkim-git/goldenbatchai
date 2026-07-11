# Critical Process Parameter (CPP) ↔ Critical Quality Attribute (CQA) Matrix

**Document ID:** PTD-03 | **Revision:** 4.1 | **Effective:** 2025-12-10

## 1. Purpose

This matrix maps process parameters to critical quality attributes and assigns a criticality rating (High / Medium / Low) based on process characterization studies, DoE, and historical multivariate analysis. Criticality reflects the strength and consistency of a parameter's effect on the attribute. The primary CQA is USP harvest yield (`[harvest][Harvest] Product. Yield`). Secondary/reference attributes are `DSP_Final_Protein (g)` and `Normalized Titer by 1000`.

## 2. CPP ↔ CQA Matrix

| Parameter | → Product. Yield (USP) | → Normalized Titer | → DSP_Final_Protein | Effect direction / shape |
|---|---|---|---|---|
| `[prd_final]VCD_BI` | **High** | High | Low (via load) | Positive — primary driver |
| `[Production]O2_supply_slope` | **High** | Medium | Low | Positive — steeper ramp better |
| `[flask_filtered][flask]125mL_Final Viability` | **High** | Medium | Low | Positive — healthier seed better |
| `[prd_final]pH_BI` | **High** | Medium | Low | **Negative above 6.9** (ceiling effect) |
| `[media_prep][media][Media B] Osmo` | **High** | Medium | Low | U-shape — deviation from ~310 reduces yield |
| `[Production]Temp_Drop_Time_hr` | **High** | Medium | Low | Negative — later shift lowers yield |
| `[media_prep][media][Media B] Glucose_Conc` | Medium | Low | Low | Over-feeding drives pH drift (interaction w/ pH) |
| `[prd_final]Via_BI` | Medium | Low | Low | Positive but collinear w/ seed viability |
| `[prd_final]Normalized Titer by 1000_BI` | Medium | — | Low | Collinear w/ VCD_BI |
| `[Production]DO_Stab_Avg` | Medium | Low | Low | Control health; extreme deviation harmful |
| `CEO Load Cond (mS/cm)` | Low | Low | **Medium** | Weak DSP-recovery effect |
| `AEO Hold Time (hr)` | Low | Low | **Medium** | Long holds weakly reduce recovery |
| `[prd_final]pCO2_BI` | Low | Low | Low | Noise in normal range |
| `[prd_final]NH4+_BI` | Low | Low | Low | Noise in normal range |
| `[prd_final]Gln_BI` | Low | Low | Low | Noise in normal range |
| `[prd_final]Reactor Fill Level_BI` | Low | Low | Low | Noise |
| `[prd_final]Age_BI` | Low | Low | Low | Noise |
| `[Production]air flow_mean` | Low | Low | Low | Noise |
| `[harvest]Centrifuge_Bowl_Speed_mean` | Low | Low | Low | Noise (clarification only) |
| `[harvest]Diff_Press_Final_Filter_mean` | Low | Low | Low | Noise (fouling indicator) |

## 3. Interaction Effects

- **pH × Glucose over-feeding:** When `[prd_final]pH_BI` > 6.9 **and** `[media_prep][media][Media B] Glucose_Conc` is high, yield loss exceeds the sum of the individual effects. Over-feeding accelerates the pH drift above the 6.9 ceiling. This combination is flagged High criticality when co-occurring.

## 4. Interpretation Notes

Parameters rated **High** to Product. Yield are the levers a golden batch must control (see PTD-04). Parameters rated **Low** are statistical noise with respect to yield and should not be cited as root causes even if they appear in a model; they may be retained for monitoring. DSP knobs (`CEO Load Cond`, `AEO Hold Time`) affect recovery/purity (`DSP_Final_Protein`) but do not create product mass — consistent with the USP-vs-DSP principle in PTD-01.
