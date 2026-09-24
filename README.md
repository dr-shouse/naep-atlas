# NAEP Atlas — state results from the Nation's Report Card
### A NeverLost Studio product · neverlost.studio

State NAEP results for grade 4 and grade 8 reading and math, 1990–2024:
a choropleth map with trends and state comparisons, a time-lapse, significance-tested change
between any two cycles, and rankings shown as rank *ranges* with 95% confidence intervals.

Built by Michael Shouse, PhD · michaelshouse.phd

---

## Static, no backend

Same setup as Sundays: the whole dataset (≈60 KB) is bundled into the site, and a Cloudflare
Worker serves `frontend/dist`. There is no API server. (This replaces the earlier
FastAPI + DuckDB version in `~/Documents/naep-atlas`, whose Parquet data did not match
published NAEP results.)

## Architecture

```
etl/
  fetch_naep.py          pulls means + standard errors from the NAEP Data Service → raw/naep_raw.csv
  build_atlas.py         canonical ETL entry point: picks R2/R3 samples, writes frontend/src/data/*
  raw/naep_raw.csv       every jurisdiction × cycle requested, incl. non-participants (blank)
  raw/us-states.geojson  source state shapes (Alaska/Hawaii become insets in build_atlas.py)

frontend/                Vite + React + deck.gl + MapLibre
  src/data/naep.json     ETL output, bundled into the site
  src/lib/stats.js       significance tests, rank ranges (all statistics live here)
  src/config.js          TIP_URL (empty = no tip jar)
```

## Dev

```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## Deploy loop

```
data:      cd etl && python fetch_naep.py && python build_atlas.py
new cycle: cd etl && python fetch_naep.py --add-year 2026 && python build_atlas.py
           (then add 2026 to MODERN in fetch_naep.py so it stays in future pulls)
deploy:    commit + git push      (or: cd frontend && npm run build && npx wrangler deploy)
```

`fetch_naep.py` uses only the Python standard library and refuses to overwrite the raw file
if any request fails.

## Methodology notes

- **Samples.** R2 (accommodations not permitted) is the only sample before 1996; R3 is used
  wherever states reported it. One sample per assessment-year for every jurisdiction, so a
  state and the nation are always compared on the same basis. R2 years are hatched on the
  year strip and hollow on trend charts.
- **Significance.** d / √(se₁² + se₂²) > 1.96. No multiple-comparison adjustment or linking
  error, so a few borderline calls can differ from the NAEP Data Explorer; the Explorer is
  authoritative.
- **Rank range.** best = 1 + states significantly higher; worst = N − states significantly lower.
- **Participation.** States that didn't take part are left blank, never estimated.
- **Map clicks** are picked on pointer-up in `StateMap.jsx` rather than through deck.gl's
  `onClick`, which didn't fire reliably in this layout.

---

© 2026 Shouse Solutions LLC · NeverLost Studio
