// NAEP Atlas is a fully static site: the whole dataset ships in the bundle.
// naep.json is written by etl/build_atlas.py. Re-run the ETL and redeploy
// whenever the numbers should change.
import data from "../data/naep.json";

export const generated   = data.generated;
export const source      = data.source;
export const assessments = data.assessments;           // { "math-8": {label, years, r2_years, domain} }
export const ASSESSMENT_KEYS = ["reading-4", "reading-8", "math-4", "math-8"];
export const states      = data.states;                // [{code, name, lon, lat}]
export const stateIndex  = Object.fromEntries(states.map(s => [s.code, s]));
export const NATION      = "NP";

// Index: scores[a][code] -> Map(year -> {year, value, se, r2})
const index = {};
for (const [a, byJuris] of Object.entries(data.scores)) {
  index[a] = {};
  for (const [code, rows] of Object.entries(byJuris)) {
    index[a][code] = new Map(rows.map(([year, value, se, r2]) =>
      [year, { year, value, se, r2: !!r2 }]));
  }
}

export function point(a, code, year) {
  return index[a]?.[code]?.get(year) ?? null;
}

/** Full time series for one jurisdiction, oldest first. */
export function series(a, code) {
  return [...(index[a]?.[code]?.values() ?? [])].sort((x, y) => x.year - y.year);
}

/** Every participating state (nation excluded) for one assessment-year. */
export function yearRows(a, year) {
  const out = [];
  for (const s of states) {
    const p = point(a, s.code, year);
    if (p) out.push({ ...p, code: s.code, name: s.name });
  }
  return out;
}

export function nation(a, year) {
  return point(a, NATION, year);
}

/** The assessment year before `year` (null for the first cycle). */
export function prevYear(a, year) {
  const ys = assessments[a].years;
  const i = ys.indexOf(year);
  return i > 0 ? ys[i - 1] : null;
}

/** Nearest available year for an assessment (used when switching tests). */
export function snapYear(a, year) {
  const ys = assessments[a].years;
  if (ys.includes(year)) return year;
  return ys.reduce((best, y) => Math.abs(y - year) < Math.abs(best - year) ? y : best, ys[ys.length - 1]);
}

/** "50 states + DC" rather than "51 states": DC is a jurisdiction, not a state. */
export function placesLabel(rows) {
  const n = rows.length, dc = rows.some(r => r.code === "DC");
  return dc ? `${n - 1} states + DC` : `${n} states`;
}

/** Chart-friendly name. */
export const shortName = n => (n === "District of Columbia" ? "D.C." : n);

export const fmt = v => (v == null ? "—" : v.toFixed(0));
export const fmt1 = v => (v == null ? "—" : v.toFixed(1));
export const signed = (v, d = 1) => (v == null ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "±") + Math.abs(v).toFixed(d));
