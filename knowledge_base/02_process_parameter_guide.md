# Process Parameter Guide — Definitions, Units, and Operating Ranges

**Document ID:** PTD-02 | **Revision:** 5.4 | **Effective:** 2025-12-02

## 1. Purpose

This guide defines each process parameter used in batch records and analytics, its unit, and its normal operating range (NOR) / target. Parameter names follow the dataset convention `[stage][substage]Parameter_stat`, where the statistic suffix denotes how a time series is summarized (mean/max/min/std/first/last/slope/sum/rate/duration_hr/_BI baseline-initial/_0..N timepoints). All ranges below are mutually consistent with the control strategy (PTD-08) and golden-batch criteria (PTD-04).

## 2. Seed Flask Parameters

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `[flask_filtered][flask]125mL_Final VCD` | ×10^6 cells/mL | 3.0 – 5.0 | Final inoculum density; higher end preferred |
| `[flask_filtered][flask]125mL_Final Viability` | % | ≥ 95 | Seed health; positive driver of final yield |

## 3. Media Preparation Parameters

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `[media_prep][media][Media B] Osmo` | mOsm/kg | 310 ± 15 (295–325) | U-shaped effect: deviation either direction reduces yield |
| `[media_prep][media][Media B] Glucose_Conc` | g/L | 4.0 – 6.0 | Feed glucose; over-feeding drives pH/metabolic drift |
| `[media_prep][media][Media_A] pH-Final` | pH | 7.0 – 7.2 | Basal media pH after compounding |

## 4. Production Bioreactor — Batch Summary (_BI)

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `[prd_final]VCD_BI` | ×10^6 cells/mL | 18 – 30 (higher better) | Peak viable cell density; **primary positive driver of yield** |
| `[prd_final]pH_BI` | pH | 6.7 – 6.9 (ceiling 6.9) | **Excursion above 6.9 causes yield loss** |
| `[prd_final]Gln_BI` | mM | 2 – 6 | Glutamine; no strong independent yield effect |
| `[prd_final]pCO2_BI` | mmHg | 40 – 90 | Dissolved CO2; not a yield driver in normal range |
| `[prd_final]NH4+_BI` | mM | < 8 | Ammonium; monitored, weak yield effect |
| `[prd_final]Normalized Titer by 1000_BI` | (norm.) | trend up | Expression proxy; collinear with VCD_BI |
| `[prd_final]Via_BI` | % | ≥ 90 | Peak-culture viability; collinear with seed viability |

## 5. Production Bioreactor — Signals

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `[Production]DO_Stab_Avg` | % air sat. | ~40 (35–45) | Dissolved-oxygen setpoint during stable phase |
| `[Production]DO_Stab_Std` | % | < 5 | DO stability; large std indicates control issues |
| `[Production]O2_supply_slope` | (norm./hr) | positive, steep | **Positive driver: stronger O2 delivery ramp → higher yield** |
| `[Production]O2_supply_max` | L/min or norm. | process-dependent | Peak oxygen sparge |
| `[Production]Temp_Drop_Time_hr` | hr | early (~48–72) | **Later temp-shift → lower yield**; earlier shift preferred |
| `[Production]Temp_First` | °C | 36.5 – 37.0 | Initial culture temperature before shift |

## 6. Harvest Parameters

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `[harvest]Centrifuge_Bowl_Speed_mean` | rpm | per equipment SOP | Clarification; not a yield driver |
| `[harvest]Centrifuge_FeedFlowRate_mean` | L/h | per equipment SOP | Throughput; not a yield driver |
| `[harvest]Diff_Press_Final_Filter_mean` | bar | < 1.5 | Filter fouling indicator; not a yield driver |

## 7. DSP Parameters

| Parameter | Unit | Target / NOR | Notes |
|---|---|---|---|
| `CEO Load Protein (g)` | g | per cycle plan | Mass loaded to CEX |
| `CEO Load Cond (mS/cm)` | mS/cm | 5 – 8 | Weakly affects DSP recovery |
| `AEO Load Conc. (g/L)` | g/L | 3 – 8 | AEX load concentration |
| `AEO Pool Prot (g)` | g | recovery-dependent | AEX pool mass |
| `AEO Hold Time (hr)` | hr | < 24 | Long holds weakly reduce DSP recovery |

## 8. Notes on Redundant Parameters
Several parameters are strongly collinear and are typically pruned in analytics: `[Production]O2_supply_sum` tracks `[Production]O2_supply_slope`; `[prd_final]Via_BI` tracks seed `125mL_Final Viability`; `[prd_final]Normalized Titer by 1000_BI` tracks `[prd_final]VCD_BI`. See PTD-09 for handling of multicollinearity.
