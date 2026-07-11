# data/

Seed dataset for the demo lives here.

- Expected file (M1): `golden_batch_demo.csv` — batch (rows) × feature (cols),
  following the naming convention in **PRD Appendix C** (`[stage][substage]Param_stat`).
- Target column: `[harvest][Harvest] Product. Yield` (USP) or `DSP_Final_Protein (g)` (DSP).
- Raw `*.csv` files are gitignored (private / large). Keep this README tracked.

Source of truth for the schema: the lecture notebooks at the repo root
(`Lecture7_AutoML.ipynb`, `Lecture10.ipynb`).
