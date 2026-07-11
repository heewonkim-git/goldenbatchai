# Troubleshooting Guide — Yield Deviations

**Document ID:** PTD-06 | **Revision:** 4.3 | **Effective:** 2026-02-20

## 1. Purpose

This guide provides a symptom → probable cause → corrective action reference for USP harvest yield deviations. It is scoped to the High-criticality drivers established in PTD-03. Noise parameters (centrifuge speed, filter differential pressure, pCO2, NH4+, Gln, reactor fill level, air-flow means) are explicitly excluded as root causes for yield deviations.

## 2. Symptom → Cause → Action Table

| Symptom (observed) | Probable cause | Corrective / preventive action |
|---|---|---|
| Low yield + `[prd_final]pH_BI` > 6.9 | Production pH excursion above the 6.9 ceiling | Verify pH probe calibration; tighten CO2/base control near ceiling; check whether glucose over-feeding drove the drift (see interaction row) |
| Low yield + `[prd_final]pH_BI` > 6.9 + high `[media_prep][media][Media B] Glucose_Conc` | **Over-feeding → pH drift interaction** — excess glucose accelerated metabolic drift above the pH ceiling | Reduce feed volume/frequency; move to demand-based feeding; hold glucose 4.0–5.5 g/L; the two effects compound, so correct both |
| Low yield + `[media_prep][media][Media B] Osmo` off ~310 (either direction) | U-shaped osmolality effect — deviation from ~310 reduces yield | Re-verify media compounding and QC; recompound if outside 310 ± 15; investigate both high and low deviations |
| Low yield + late `[Production]Temp_Drop_Time_hr` | Temperature shift applied too late | Advance the temp-shift trigger (target ≤ 60 hr); review the shift-timing control logic and trigger criteria |
| Low yield + low `[prd_final]VCD_BI` | Poor culture growth / low peak viable cell density | Trace back to seed health (viability, seed VCD), media QC, and early-phase DO/pH; VCD is the primary yield lever |
| Low yield + low seed `125mL_Final Viability` | Unhealthy inoculum set an adverse trajectory | Investigate thaw/expansion, passage number, media lot; do not proceed to production with viability < 95 % |
| Low yield + shallow `[Production]O2_supply_slope` | Weak oxygen-delivery ramp during growth | Check sparge/oxygen supply capacity and DO control; a steeper ramp supports higher VCD and yield |
| Low DSP recovery, USP yield normal | DSP step recovery issue (not a USP problem) | Check `CEO Load Cond (mS/cm)` and `AEO Hold Time (hr)`; this affects `DSP_Final_Protein`, not `Product. Yield` |

## 3. Diagnostic Order

1. Confirm the deviation is USP (low `Product. Yield`) versus DSP (low `DSP_Final_Protein` with normal harvest yield). USP and DSP have different root-cause sets (PTD-01).
2. For USP deviations, rank suspected drivers by PTD-03 criticality. Check the High drivers first: VCD_BI, pH_BI (ceiling 6.9), Media B Osmo (~310), Temp_Drop_Time_hr, O2_supply_slope, seed viability.
3. Check for the pH × over-feeding interaction whenever a pH excursion is present.
4. Do not attribute yield loss to noise parameters even if they moved; correlation without criticality is not causation (see PTD-09).

## 4. Escalation

Recurrent pH excursions or osmolality misses across multiple batches indicate a systematic control or media-prep issue and should be escalated to MSAT for a control-strategy review (PTD-08).
