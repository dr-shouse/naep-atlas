import { useEffect, useMemo, useState } from "react";
import { shortName, placesLabel, assessments, point, states, nation, NATION, signed } from "../lib/data";
import { diffTest, Z } from "../lib/stats";
import { ABOVE, BELOW } from "../lib/color";

function presets(years) {
  const has = y => years.includes(y);
  const out = [];
  if (has(2019) && has(2022)) out.push({ from: 2019, to: 2022, label: "Pandemic drop", sub: "2019→2022" });
  if (has(2022) && has(2024)) out.push({ from: 2022, to: 2024, label: "Since 2022", sub: "2022→2024" });
  if (has(2019) && has(2024)) out.push({ from: 2019, to: 2024, label: "Net since 2019", sub: "2019→2024" });
  if (has(2003) && has(2019)) out.push({ from: 2003, to: 2019, label: "All-states era", sub: "2003→2019" });
  out.push({ from: years[0], to: years.at(-1), label: "Full record", sub: `${years[0]}→${years.at(-1)}` });
  return out;
}

export default function Change({ a, selected, setSelected }) {
  const A = assessments[a];
  const P = useMemo(() => presets(A.years), [A]);
  const [from, setFrom] = useState(P[0].from);
  const [to, setTo] = useState(P[0].to);
  useEffect(() => {  // new assessment → reset to its first preset
    setFrom(P[0].from); setTo(P[0].to);
  }, [P]);

  const rows = useMemo(() => {
    const out = [];
    for (const s of [...states, { code: NATION, name: "Nation (public)" }]) {
      const p = point(a, s.code, to), q = point(a, s.code, from);
      if (!p || !q) continue;
      out.push({ code: s.code, name: s.name, from: q, to: p, t: diffTest(p, q) });
    }
    return out.sort((x, y) => y.t.d - x.t.d);
  }, [a, from, to]);

  const st = rows.filter(r => r.code !== NATION);
  const up = st.filter(r => r.t.dir > 0).length, down = st.filter(r => r.t.dir < 0).length;
  const missing = states.length - st.length;
  const nat = rows.find(r => r.code === NATION);
  const r2 = A.r2_years.includes(from) !== A.r2_years.includes(to);

  // chart geometry
  const W = 760, rowH = 15, pL = 118, pR = 56, pT = 24;
  const H = pT + rows.length * rowH + 20;
  const ext = Math.max(4, ...rows.map(r => Math.abs(r.t.d) + Z * r.t.se));
  const lim = Math.ceil(ext / 5) * 5;
  const x = d => pL + ((d + lim) / (2 * lim)) * (W - pL - pR);
  const ticks = [];
  for (let v = -lim; v <= lim; v += lim > 15 ? 10 : 5) ticks.push(v);

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Change, {from} → {to}</h2>
            <p className="sub">{A.label}. Every state (and DC) that took part in both years, sorted by change. Solid bars are statistically significant (p &lt; .05); whiskers are 95% intervals for the change.</p>
          </div>
        </div>

        <div className="chips" style={{ marginBottom: 10 }}>
          {P.map(p => (
            <button key={p.sub} className={"chip-btn" + (p.from === from && p.to === to ? " on" : "")}
              onClick={() => { setFrom(p.from); setTo(p.to); }}>
              {p.label} <small>{p.sub}</small>
            </button>
          ))}
          <span className="custom-range">
            <select value={from} onChange={e => setFrom(+e.target.value)} aria-label="From year">
              {A.years.filter(y => y < to).map(y => <option key={y}>{y}</option>)}
            </select>
            →
            <select value={to} onChange={e => setTo(+e.target.value)} aria-label="To year">
              {A.years.filter(y => y > from).map(y => <option key={y}>{y}</option>)}
            </select>
          </span>
        </div>

        <div className="stat-strip">
          <Stat label="Nation" value={nat ? signed(nat.t.d) : "—"} note={nat ? (nat.t.sig ? "significant" : "not significant") : ""} />
          <Stat label="Sig. gains" value={up} color={ABOVE} note={`of ${placesLabel(st)}`} />
          <Stat label="Sig. declines" value={down} color={BELOW} note={`of ${placesLabel(st)}`} />
          <Stat label="No sig. change" value={st.length - up - down} note={missing ? `${missing} not in both years` : ""} />
        </div>
        {r2 && <p className="note">One end of this window uses the R2 sample (accommodations not permitted) and the other R3; NCES reports these as a single trend, but read small changes with care.</p>}

        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Score change ${from} to ${to} by state`}>
          {ticks.map(v => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={pT - 6} y2={H - 16} stroke={v === 0 ? "#8a96a1" : "#efeee8"} />
              <text x={x(v)} y={pT - 10} textAnchor="middle">{v > 0 ? "+" + v : v}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const yy = pT + i * rowH;
            const isN = r.code === NATION, isSel = r.code === selected;
            const color = r.t.d >= 0 ? ABOVE : BELOW;
            return (
              <g key={r.code} onClick={() => !isN && setSelected(r.code)} style={{ cursor: isN ? "default" : "pointer" }}>
                {(isSel || isN) && <rect x={0} y={yy} width={W} height={rowH} fill={isN ? "#f1f0ea" : "#e9f1fb"} />}
                <text x={pL - 8} y={yy + rowH - 4} textAnchor="end"
                  style={{ fontWeight: isSel || isN ? 600 : 400, fill: isSel || isN ? "#12263a" : undefined }}>
                  {shortName(r.name)}
                </text>
                <rect x={Math.min(x(0), x(r.t.d))} y={yy + 3} width={Math.abs(x(r.t.d) - x(0))} height={rowH - 6}
                  fill={color} fillOpacity={r.t.sig ? 0.9 : 0.25} stroke={color} strokeOpacity={r.t.sig ? 0 : 0.6} rx={1} />
                <line x1={x(r.t.d - Z * r.t.se)} x2={x(r.t.d + Z * r.t.se)} y1={yy + rowH / 2} y2={yy + rowH / 2}
                  stroke="#12263a" strokeOpacity=".45" />
                <text x={W - pR + 6} y={yy + rowH - 4} style={{ fill: r.t.sig ? color : undefined, fontWeight: r.t.sig ? 500 : 400 }}>
                  {signed(r.t.d)}
                </text>
                <title>{`${r.name}: ${r.from.value.toFixed(1)} → ${r.to.value.toFixed(1)} (${signed(r.t.d)}, 95% CI ${signed(r.t.d - Z * r.t.se)} to ${signed(r.t.d + Z * r.t.se)}; ${r.t.sig ? "significant" : "not significant"})`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Stat({ label, value, note, color }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value" style={{ color }}>{value}</div>
      {note && <div className="note-sm">{note}</div>}
    </div>
  );
}
