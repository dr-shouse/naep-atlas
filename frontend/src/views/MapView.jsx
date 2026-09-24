import { useState } from "react";
import StateMap from "../components/StateMap";
import TrendChart, { LINE_COLORS } from "../components/TrendChart";
import { assessments, stateIndex, states, series } from "../lib/data";

const METRICS = [
  { id: "score",  label: "Average score" },
  { id: "nation", label: "Compared with nation" },
  { id: "change", label: "Change since last cycle" },
];

export default function MapView({ a, year, setYear, selected, setSelected, compare, setCompare }) {
  const [metric, setMetric] = useState("score");
  const onMapClick = code => {
    if (code === selected) return;
    setSelected(code);
  };
  const codes = [selected, ...compare.filter(c => c !== selected)];
  const available = states.filter(s => !codes.includes(s.code) && series(a, s.code).length);

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>{assessments[a].label}, {year}</h2>
            <p className="sub">Click a state for its trend. Hover for score, 95% margin, and significance.</p>
          </div>
          <div className="seg-toggle" role="group" aria-label="Map metric">
            {METRICS.map(m => (
              <button key={m.id} className={metric === m.id ? "on" : ""} onClick={() => setMetric(m.id)}>{m.label}</button>
            ))}
          </div>
        </div>
        <StateMap a={a} year={year} metric={metric} selected={selected} compare={compare} onSelect={onMapClick} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>{stateIndex[selected]?.name} over time</h2>
            <p className="sub">
              Shaded band = 95% confidence interval. Dashed = national public. Hollow points = R2 sample
              (accommodations not permitted). Click a year to move the map.
            </p>
          </div>
        </div>
        <div className="chips">
          {codes.map((c, i) => (
            <span key={c} className="chip" style={{ borderColor: LINE_COLORS[i % LINE_COLORS.length], color: LINE_COLORS[i % LINE_COLORS.length] }}>
              {c}
              {i > 0 && <button aria-label={`Remove ${c}`} onClick={() => setCompare(compare.filter(x => x !== c))}>×</button>}
            </span>
          ))}
          {codes.length < LINE_COLORS.length && (
            <select value="" aria-label="Add a state to compare"
              onChange={e => e.target.value && setCompare([...compare, e.target.value])}>
              <option value="">+ compare state…</option>
              {available.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          )}
          {compare.length > 0 && <button className="linkish" onClick={() => setCompare([])}>clear</button>}
        </div>
        <TrendChart a={a} codes={codes} year={year} onYear={setYear} />
      </div>
    </div>
  );
}
