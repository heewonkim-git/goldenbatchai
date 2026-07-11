# Process Overview — mAb Drug Substance Manufacturing

**Document ID:** PTD-01 | **Product:** Monoclonal Antibody (mAb) Drug Substance | **Facility:** CDMO Bldg 4, Suite 200
**Revision:** 6.2 | **Effective:** 2025-11-14

## 1. Purpose and Scope

This document describes the end-to-end manufacturing process transferred to the CDMO for production of the client's IgG1 monoclonal antibody drug substance. It defines the overall process flow, the purpose of each unit operation, and the rationale for why upstream (USP) operations govern titer and yield while downstream (DSP) operations govern recovery and purity. It is the anchor document for the process knowledge base and should be read before the parameter, control, and troubleshooting guides.

## 2. Process Flow Summary

The process proceeds through the following sequence:

**Seed flask → Media preparation (Media A / Media B / Media C) → Production bioreactor (stirred-tank) → Harvest (continuous disc-stack centrifuge + depth filtration + final filtration) → DSP purification: CEX (Cation Exchange, "CEO") → AEX (Anion Exchange, "AEO").**

Each batch carries a unique `Batch_No` identifier (e.g., B2401). The primary critical quality attribute (CQA) tracked at release of the upstream train is the USP harvest yield, recorded as `[harvest][Harvest] Product. Yield` in grams. The secondary attribute is `DSP_Final_Protein (g)`, and the reference potency/expression attribute is `Normalized Titer by 1000`.

## 3. Unit Operations

### 3.1 Seed Flask (Inoculum Expansion)
Cells are thawed and expanded through shake-flask stages. The final 125 mL flask stage sets the health and density of the inoculum via `[flask_filtered][flask]125mL_Final VCD` (viable cell density) and `[flask_filtered][flask]125mL_Final Viability` (%). A healthy, high-viability, high-VCD inoculum establishes the trajectory the production culture will follow.

### 3.2 Media Preparation (Media A / B / C)
Basal and feed media are compounded and QC-released before use. Key attributes include `[media_prep][media][Media B] Osmo` (osmolality), `[media_prep][media][Media B] Glucose_Conc`, and `[media_prep][media][Media_A] pH-Final`. Osmolality and glucose concentration directly influence the culture's metabolic state and feeding regime.

### 3.3 Production Bioreactor (Stirred-Tank)
The production bioreactor is where the antibody is expressed and where the great majority of product mass is created. The culture is monitored via batch-summary parameters (peak `[prd_final]VCD_BI`, `[prd_final]pH_BI`, `[prd_final]Gln_BI`, `[prd_final]pCO2_BI`, `[prd_final]NH4+_BI`, `[prd_final]Normalized Titer by 1000_BI`) and time-series signals (`[Production]DO_Stab_Avg`, `[Production]O2_supply_slope`, `[Production]Temp_Drop_Time_hr`). Peak viable cell density and controlled culture chemistry (pH, oxygen delivery, temperature-shift timing) are the primary levers of final yield.

### 3.4 Harvest (Centrifuge + Depth/Final Filtration)
Cells and debris are removed by a continuous disc-stack centrifuge (`[harvest]Centrifuge_Bowl_Speed_mean`, `[harvest]Centrifuge_FeedFlowRate_mean`) followed by depth and final (0.2 µm) filtration (`[harvest]Diff_Press_Final_Filter_mean`). Harvest clarifies the product-containing broth; it recovers what USP produced but does not create additional product mass. The clarified harvest yield is the primary CQA.

### 3.5 DSP Purification (CEO → AEO)
The clarified harvest is purified by Cation Exchange (CEO) then Anion Exchange (AEO) chromatography, tracked via `CEO Load Protein (g)`, `CEO Load Cond (mS/cm)`, `AEO Load Conc. (g/L)`, `AEO Pool Prot (g)`, and `AEO Hold Time (hr)`. DSP concentrates, polishes, and removes impurities.

## 4. Why USP Determines Yield and DSP Determines Recovery

Product mass is generated in the production bioreactor. Consequently, the USP harvest yield (`Product. Yield`, mean ~76.5 g, range ~47–99 g) is set upstream, and it is the target CQA for process optimization. DSP steps operate at a recovery of roughly 0.75–0.95 and are engineered for purity and impurity clearance — they cannot manufacture additional product. Therefore, root-cause investigation of low yield begins in USP (seed health, peak VCD, pH control, oxygen delivery, temperature-shift timing, media osmolality/feeding), while DSP investigations focus on step recovery and pool purity. This distinction frames every downstream analysis in this knowledge base.
