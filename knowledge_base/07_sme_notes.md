# SME Notes — Process Heuristics (Informal)

**Document ID:** PTD-07 | **Compiled by:** MSAT / Upstream SMEs | **Last updated:** 2026-03-11
**Note:** These are experience-based heuristics from process SMEs, not controlled specifications. They are consistent with the formal ranges in PTD-02/04/08 and are meant to give the "feel" of the process.

## 1. Seed Sets the Tone

The single thing most predictive of a good run is the seed. If the 125 mL final flask comes in with viability at 96–98 % and a solid `125mL_Final VCD`, the production culture almost always follows a good trajectory and hits a high peak `[prd_final]VCD_BI`. A tired seed (viability creeping below 95 %) is the earliest warning we get, and it usually can't be fully rescued downstream. High peak VCD is where the yield comes from — everything else is protecting that trajectory.

## 2. Watch the pH Ceiling — 6.9 Is the Line

We treat pH_BI = 6.9 as a hard ceiling. Runs that drift above 6.9 lose yield, plain and simple — our own numbers put the pH-high group around 71–72 g against about 78 g for the in-range group, and that gap is real, not scatter. Keep production pH in the 6.7–6.9 band. If you see it climbing toward 6.9, act early; once it's over, the yield is already leaving.

## 3. Don't Over-Feed Glucose

The most common way we get a pH excursion is over-feeding. Push too much Media B glucose and the culture's metabolism drifts, pH climbs through the ceiling, and now you've got two problems stacked on each other — that's the interaction we keep seeing in the low-yield batches. Keep glucose feed in the 4.0–5.5 g/L neighborhood and feed to demand, not on a fixed generous schedule. "Feed less than you think" is the rule of thumb here.

## 4. Shift Temperature Early, Not Late

Earlier temperature shifts tend to help. When `Temp_Drop_Time_hr` slips late, yield tends to slip with it. Our best batches shifted around 50–58 hr. If the shift trigger is drifting later run over run, treat it as a process problem, not a coincidence.

## 5. Oxygen Delivery Ramp Matters

A strong, early oxygen-supply ramp (steep `O2_supply_slope`) supports the high cell densities we want. Shallow ramps show up in the low-yield batches. It's not about the absolute max so much as how decisively oxygen delivery climbs to meet demand. (Note: O2_supply_sum basically tells you the same thing as the slope — don't treat them as two separate findings.)

## 6. Osmolality — Aim for the Middle, ~310

Media B osmolality has a sweet spot around 310. Both too low and too high hurt — it's a valley, not a slope. We've lost otherwise-perfect batches to osmo coming in at 284 or 331. Aim for 310, keep it within about ±10, and re-check media QC if you're near the edges.

## 7. What NOT to Chase

When a batch comes in low, people love to point at centrifuge speed, filter DP, pCO2, ammonium, or air-flow numbers. In our experience those are noise for yield — they move around and don't move the outcome. Chase the drivers that actually matter (VCD, seed viability, pH ceiling, osmo, temp-shift timing, O2 ramp). The model will sometimes surface a noise parameter; that's our cue to confirm with process knowledge, not to redesign the process around it.
