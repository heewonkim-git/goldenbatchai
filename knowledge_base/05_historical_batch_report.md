# Historical Batch Report — Selected Campaign Batches

**Document ID:** PTD-05 | **Revision:** 2.9 | **Effective:** 2026-02-03
**Scope:** Representative batches from campaigns 24-A through 25-C, selected to illustrate golden and low-yield outcomes with root causes.

## 1. Summary Table

| Batch_No | Product. Yield (g) | VCD_BI | pH_BI | Media B Osmo | Temp_Drop_Time_hr | O2_supply_slope | Outcome |
|---|---|---|---|---|---|---|---|
| B2401 | 92.4 | 27.1 | 6.82 | 308 | 54 | steep | **Golden** |
| B2403 | 88.0 | 25.6 | 6.78 | 312 | 58 | steep | **Golden** |
| B2407 | 71.2 | 22.0 | 6.97 | 309 | 60 | moderate | Low — pH excursion |
| B2412 | 63.5 | 20.4 | 7.02 | 306 | 66 | moderate | Low — pH excursion + late shift |
| B2418 | 68.9 | 24.8 | 6.85 | 284 | 57 | steep | Low — off-target osmo |
| B2502 | 86.7 | 26.3 | 6.80 | 314 | 52 | steep | **Golden** |
| B2506 | 58.1 | 18.9 | 6.99 | 331 | 70 | shallow | Low — multiple drivers |
| B2511 | 90.1 | 28.0 | 6.75 | 311 | 50 | steep | **Golden** |

## 2. Golden Batch Notes

**B2401 (92.4 g)** — Seed viability 97 %, peak `[prd_final]VCD_BI` 27.1, pH held at 6.82 (below the 6.9 ceiling), Media B osmolality 308 (near the ~310 target), early temperature shift at 54 hr, and a steep `[Production]O2_supply_slope`. This batch is the campaign reference exemplar.

**B2511 (90.1 g)** — Highest peak VCD of the set (28.0) with pH_BI 6.75 and an early shift (50 hr). Confirms that high VCD + in-range pH + early shift + strong O2 ramp reproduces top-tier yield.

**B2403, B2502** — Same profile pattern; both cleared 85 g with all High-criticality drivers inside their golden windows.

## 3. Low-Yield Batch Root Causes

**B2407 (71.2 g)** — pH_BI reached 6.97, above the 6.9 ceiling. Everything else was nominal. Attributed to a production pH excursion; consistent with the group finding that batches with pH_BI > 6.9 average ~71.5 g vs ~78.3 g for ≤ 6.9.

**B2412 (63.5 g)** — Two High drivers off: pH_BI 7.02 (excursion) and a late temperature shift (66 hr). Investigation traced the pH drift to glucose over-feeding earlier in the run (Media B Glucose_Conc high), the classic over-feeding → pH-drift interaction.

**B2418 (68.9 g)** — VCD, pH, and shift timing were all good, but Media B osmolality was 284 mOsm/kg, well below the ~310 target. The U-shaped osmolality effect (deviation in either direction) explains the yield loss despite otherwise-golden parameters.

**B2506 (58.1 g)** — Lowest of the set. Low peak VCD (18.9), pH excursion (6.99), high osmolality (331), late shift (70 hr), and a shallow O2 ramp — a stack of adverse High-criticality drivers. Illustrates additive/interacting loss.

## 4. Takeaways

The named low-yield batches are explained entirely by High-criticality drivers from PTD-03 (VCD, pH ceiling, osmolality, temp-shift timing, O2 ramp) and their interactions — not by centrifuge speed, filter DP, pCO2, NH4+, or other noise parameters. Root-cause reviews should follow the same discipline.
