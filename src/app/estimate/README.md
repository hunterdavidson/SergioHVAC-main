# HVAC Estimate Calculator (DFW, 40% Margin)

Standalone calculator for `/estimate`. No network calls; all logic is client-side.

Key rules
- Region: DFW. A simple ZIP-prefix multiplier is applied (760=1.00, 761=1.02, 750=1.03).
- Overhead: 12% of materials + labor.
- Seasonal uplift: +10% summer (labor only).
- Access multipliers: easy 0.95, standard 1.00, difficult 1.15 (labor only).
- After-hours/emergency: 1.25× (labor only).
- Permit fee: flat $175 (configurable). Crane/disposal flat fees available.
- Labor billing: per-job by default. Optional per-hour mode (hidden unless selected).
- Good/Better/Best tiers for replacements (SEER2/AFUE tiers).
- Texas sales tax:
  - Residential: tax materials/equipment and taxable add-ons only; labor not taxable.
  - Commercial: tax both labor and materials.

Margin math
- Cost = (materials + labor + overhead + fees) × regionMultiplier
- Target price for 40% gross margin: `price = cost / (1 - 0.40) = cost / 0.60`, rounded to nearest $25.
- Tax is applied to taxable base (materials; or materials+labor for commercial).
- Total = price + tax

Timing assumptions (used for tooltips / optional hourly mode)
- AC split change-out: ~4–8 hours (same-day)
- Furnace replacement: ~4–8 hours (same-day)
- Heat pump replacement: ~6–9 hours
- Ductless mini-split: single-zone ~4–6 hours; 2–3 zones ~1 day; 4–5 zones ~2–3 days
- Ductwork adders (hourly mode only): minor +6h, moderate +12h, major +20h

Files
- `estimate-calculator.component.{ts,html,scss}` — UI + reactive form
- `estimate.service.ts` — pricing engine (`estimateCost`)
- `pricing-config.ts` — region and business defaults

Notes
- Residential vs Commercial tax model based on Texas Comptroller guidance: residential labor generally not taxable; materials are. Commercial labor generally taxable along with materials.
- Financing UI is intentionally hidden per business preference.
