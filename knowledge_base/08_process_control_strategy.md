# Process Control Strategy — Setpoints, Deadbands, and Alarm Limits

**Document ID:** PTD-08 | **Revision:** 5.0 | **Effective:** 2026-03-25

## 1. Purpose

This document defines the control strategy for the production bioreactor and adjacent operations: setpoints, control deadbands, alarm limits, and control logic. Values are consistent with the parameter guide (PTD-02) and golden-batch windows (PTD-04).

## 2. pH Control

- **Setpoint / deadband:** pH 6.80 ± 0.10 (operating band 6.70–6.90).
- **Ceiling (hard):** 6.90. pH must not exceed 6.90; `[prd_final]pH_BI` above this is a defined excursion associated with yield loss.
- **Control logic:** CO2 sparge for acidification and base (carbonate) addition for correction, with dead-band control to avoid oscillation. High-pH alarm at 6.90; high-high at 6.95.
- **Rationale:** Above 6.90 the culture loses yield (~71.5 g vs ~78.3 g for in-range, p ≈ 0.003). Early corrective action is required as pH approaches the ceiling.

## 3. Dissolved Oxygen (DO) Control

- **Setpoint:** `[Production]DO_Stab_Avg` ~ 40 % air saturation (band 35–45 %).
- **Stability target:** `[Production]DO_Stab_Std` < 5 %. Larger variability triggers a control review.
- **Oxygen supply:** cascade sparge/O2 enrichment. The `[Production]O2_supply_slope` should ramp decisively during the growth phase to meet rising demand; a shallow ramp is an alarming trend for yield.
- **Alarm:** low DO alarm at 30 %.

## 4. Temperature and Temperature-Shift Timing

- **Initial temperature:** `[Production]Temp_First` 36.5–37.0 °C.
- **Shift strategy:** apply the production temperature down-shift **early**, target `[Production]Temp_Drop_Time_hr` ≤ 60 hr (best-practice 50–58 hr). Later shifts are associated with lower yield.
- **Trigger:** shift on the defined culture criterion (density/time); audit the trigger if shift timing drifts later across batches.

## 5. Glucose Feed Strategy (Media B)

- **Target concentration:** `[media_prep][media][Media B] Glucose_Conc` 4.0–5.5 g/L, maintained by demand-based feeding.
- **Anti-over-feed control:** avoid fixed generous bolus feeding. Over-feeding drives the metabolic/pH drift that pushes pH through the 6.90 ceiling (the pH × glucose interaction). Feed strategy and pH control are managed together.

## 6. Media Osmolality (Media B)

- **Target:** `[media_prep][media][Media B] Osmo` 310 mOsm/kg, control band 310 ± 15 (295–325), golden band 310 ± 10.
- **Logic:** osmolality has a U-shaped effect on yield; both high and low deviations are corrected at media prep/QC before release.

## 7. Seed Release Gate

- `[flask_filtered][flask]125mL_Final Viability` ≥ 95 % and `125mL_Final VCD` within 3.0–5.0 ×10^6 cells/mL required before inoculation. Sub-spec seed is not advanced.

## 8. DSP Load / Hold Limits

- `CEO Load Cond (mS/cm)` 5–8; conditioning outside this weakly reduces CEX recovery.
- `AEO Load Conc. (g/L)` 3–8; `AEO Hold Time (hr)` < 24 to protect recovery/purity.
- These are DSP recovery controls (affecting `DSP_Final_Protein`), not USP yield controls.

## 9. Alarm Summary

| Parameter | Warning | Action / Excursion |
|---|---|---|
| pH_BI | ≥ 6.88 | ≥ 6.90 (excursion) |
| DO_Stab_Avg | < 33 % | < 30 % |
| Temp_Drop_Time_hr | > 60 hr | > 66 hr |
| Media B Osmo | outside 300–320 | outside 295–325 |
| Seed Viability | < 96 % | < 95 % (hold) |
