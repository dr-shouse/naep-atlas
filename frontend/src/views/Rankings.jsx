import { useMemo } from "react";
import { shortName, assessments, nation, yearRows, point } from "../lib/data";
import { rankRanges, diffTest, Z } from "../lib/stats";
import { ABOVE, BELOW, SAME } from "../lib/color";

export default function Rankings({ a, year, selected, setSelected }) {
  const A = assessments[a];
  const n = nation(a, year);
  const rows = useMemo(() => rankRanges(yearRows(a, year)), [a, year]);
  const selRow = rows.find(r => r.code === selected);
  const selPoint = point(a, selected, year);

  const W = 760, rowH = 15, pL = 118, pR = 160, pT = 24;
  const H = pT + rows.length * rowH + 20;
  const lo = Math.floor(Math.min(...rows.map(r => r.value - Z * r.se)) / 5) * 5;
  const hi = Math.ceil(Math.max(...rows.map(r => r.value + Z * r.se)) / 5) * 5;
  const x = v => pL + ((v - lo) / (hi - lo)) * (W - pL - pR);
  const ticks = [];
  for (let v = lo; v <= hi; v += (hi - lo) > 50 ? 10 : 5) ticks.push(v);

  const sameAsSel = selPoint ? rows.filter(r => r.code !== selected && !diffTest(r, selPoint).sig).length : 0;

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Rankings, {year}</h2>
            <p className="sub">
              {A.label}. Dots are average scores with 95% confidence intervals. The rank range is the honest
              version of a rank: the best and worst places each state could hold given which differences are
              statistically significant. Colors compare each state with {selRow ? selRow.name : "the selected state"}.
            </p>
          </div>
        </div>
        {selRow ? (
          <p className="callout">
            <b>{selRow.name}</b> scored {selRow.value.toFixed(1)}: ranked {selRow.rank} of {rows.length} by point estimate,
            but anywhere from <b>{selRow.best}</b> to <b>{selRow.worst}</b> once sampling error is considered.
            {" "}{sameAsSel} other {sameAsSel === 1 ? "state is" : "states are"} not significantly different.
          </p>
        ) : (
          <p className="callout">{selected} did not take part in {year}. Pick a state from the list to compare.</p>
        )}

        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`State rankings ${year} with confidence intervals`}>
          {ticks.map(v => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={pT - 6} y2={H - 16} stroke="#efeee8" />
              <text x={x(v)} y={pT - 10} textAnchor="middle">{v}</text>
            </g>
          ))}
          {n && (
            <g>
              <line x1={x(n.value)} x2={x(n.value)} y1={pT - 6} y2={H - 16} stroke="#8a96a1" strokeDasharray="4 3" />
              <text x={x(n.value)} y={H - 4} textAnchor="middle">nation {n.value.toFixed(0)}</text>
            </g>
          )}
          <text x={W - pR + 24} y={pT - 10} style={{ fontSize: 9 }}>RANK</text>
          <text x={W - pR + 64} y={pT - 10} style={{ fontSize: 9 }}>RANGE</text>
          {rows.map((r, i) => {
            const yy = pT + i * rowH + rowH / 2;
            const isSel = r.code === selected;
            const t = selPoint && !isSel ? diffTest(r, selPoint) : null;
            const c = isSel ? "#12263a" : !t ? SAME : t.dir > 0 ? ABOVE : t.dir < 0 ? BELOW : "#8a96a1";
            return (
              <g key={r.code} onClick={() => setSelected(r.code)} style={{ cursor: "pointer" }}>
                {isSel && <rect x={0} y={yy - rowH / 2} width={W} height={rowH} fill="#e9f1fb" />}
                {t && !t.sig && <rect x={0} y={yy - rowH / 2} width={4} height={rowH} fill="#8a96a1" />}
                <text x={pL - 8} y={yy + 3.5} textAnchor="end"
                  style={{ fontWeight: isSel ? 600 : 400, fill: isSel ? "#12263a" : undefined }}>{shortName(r.name)}</text>
                <line x1={x(r.value - Z * r.se)} x2={x(r.value + Z * r.se)} y1={yy} y2={yy}
                  stroke={c} strokeWidth={isSel ? 2.5 : 1.6} strokeOpacity=".75" />
                <circle cx={x(r.value)} cy={yy} r={isSel ? 4.5 : 3.2} fill={c} />
                <text x={W - pR + 24} y={yy + 3.5}>{r.rank}</text>
                <text x={W - pR + 64} y={yy + 3.5} style={{ fill: isSel ? "#12263a" : undefined }}>
                  {r.best === r.worst ? r.best : `${r.best}–${r.worst}`}
                </text>
                <title>{`${r.name}: ${r.value.toFixed(1)} (95% CI ${(r.value - Z * r.se).toFixed(1)}–${(r.value + Z * r.se).toFixed(1)}); rank ${r.rank}, range ${r.best}–${r.worst}`}</title>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          <span className="key"><span className="swatch" style={{ background: ABOVE }} />significantly higher than selected</span>
          <span className="key"><span className="swatch" style={{ background: "#8a96a1" }} />not significantly different (gray tick at left)</span>
          <span className="key"><span className="swatch" style={{ background: BELOW }} />significantly lower</span>
        </div>
      </div>
    </div>
  );
}
