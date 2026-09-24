import { useMemo } from "react";
import { assessments, series, stateIndex, NATION } from "../lib/data";
import { Z } from "../lib/stats";

// Comparison lines avoid red and green, which now mean worse/better.
export const LINE_COLORS = ["#2a78d6", "#7a5cc7", "#b0891a", "#c2417d", "#4a9fb5", "#12263a"];

/**
 * State trend vs national public. First code gets a 95% CI band; the rest
 * are comparison lines. Hollow markers = R2 sample (accommodations not
 * permitted); a dotted rule marks where accommodations begin.
 */
export default function TrendChart({ a, codes, year, onYear }) {
  const W = 760, H = 280, pL = 40, pR = 70, pT = 14, pB = 26;
  const A = assessments[a];
  const years = A.years;
  const lines = useMemo(
    () => codes.map(c => ({ code: c, pts: series(a, c) })).filter(l => l.pts.length),
    [a, codes]
  );
  const nat = useMemo(() => series(a, NATION), [a]);

  const all = [...nat, ...lines.flatMap(l => l.pts)];
  const lo = Math.floor(Math.min(...all.map(p => p.value - Z * p.se)) / 5) * 5;
  const hi = Math.ceil(Math.max(...all.map(p => p.value + Z * p.se)) / 5) * 5;
  const x0 = years[0], x1 = years[years.length - 1];
  const x = yr => pL + ((yr - x0) / (x1 - x0)) * (W - pL - pR);
  const y = v => H - pB - ((v - lo) / (hi - lo)) * (H - pT - pB);
  const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${x(p.year)},${y(p.value)}`).join("");
  const firstR3 = years.find(yr => !A.r2_years.includes(yr));
  const ticks = [];
  for (let v = lo; v <= hi; v += (hi - lo) > 40 ? 10 : 5) ticks.push(v);

  const primary = lines[0];
  const band = primary
    ? primary.pts.map(p => `${x(p.year)},${y(p.value + Z * p.se)}`).join(" ") + " " +
      [...primary.pts].reverse().map(p => `${x(p.year)},${y(p.value - Z * p.se)}`).join(" ")
    : "";

  // End labels, nudged apart so they don't overlap.
  const ends = [
    ...lines.map((l, i) => ({ key: l.code, label: l.code, color: LINE_COLORS[i % LINE_COLORS.length], v: l.pts.at(-1).value, yr: l.pts.at(-1).year })),
    { key: "NP", label: "Nation", color: "#8a96a1", v: nat.at(-1).value, yr: nat.at(-1).year },
  ].map(e => ({ ...e, ly: y(e.v) })).sort((p, q) => p.ly - q.ly);
  for (let i = 1; i < ends.length; i++) if (ends[i].ly - ends[i - 1].ly < 11) ends[i].ly = ends[i - 1].ly + 11;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Trend for ${codes.join(", ")} vs nation, ${A.label}`}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={pL} x2={W - pR} y1={y(v)} y2={y(v)} stroke="#efeee8" />
          <text x={pL - 6} y={y(v) + 3} textAnchor="end">{v}</text>
        </g>
      ))}
      {years.map(yr => (
        <g key={yr} onClick={() => onYear?.(yr)} style={{ cursor: onYear ? "pointer" : "default" }}>
          <rect x={x(yr) - 10} y={pT} width={20} height={H - pT - pB} fill="transparent" />
          {yr === year && <line x1={x(yr)} x2={x(yr)} y1={pT} y2={H - pB} stroke="#12263a" strokeOpacity=".25" />}
          <text x={x(yr)} y={H - 8} textAnchor="middle"
            style={{ fontWeight: yr === year ? 600 : 400, fill: yr === year ? "#12263a" : undefined }}>
            {"’" + String(yr).slice(2)}
          </text>
        </g>
      ))}
      {firstR3 && A.r2_years.length > 0 && (
        <g>
          <line x1={x(firstR3) - 4} x2={x(firstR3) - 4} y1={pT} y2={H - pB} stroke="#8a96a1" strokeDasharray="1 3" />
          <text x={x(firstR3) - 1} y={pT + 8} style={{ fontSize: 8.5 }}>accommodations permitted →</text>
        </g>
      )}

      {band && <polygon points={band} fill="#2a78d6" fillOpacity=".12" />}

      <path d={path(nat)} fill="none" stroke="#8a96a1" strokeWidth="1.5" strokeDasharray="5 4" />
      {lines.map((l, i) => {
        const c = LINE_COLORS[i % LINE_COLORS.length];
        return (
          <g key={l.code}>
            <path d={path(l.pts)} fill="none" stroke={c} strokeWidth={i === 0 ? 2.5 : 1.8}
              strokeLinejoin="round" strokeLinecap="round" />
            {l.pts.map(p => (
              <circle key={p.year} cx={x(p.year)} cy={y(p.value)} r={i === 0 ? 3.5 : 2.6}
                fill={p.r2 ? "#fff" : c} stroke={c} strokeWidth="1.5">
                <title>{`${stateIndex[l.code]?.name ?? l.code} ${p.year}: ${p.value.toFixed(1)} (95% CI ${(p.value - Z * p.se).toFixed(1)}–${(p.value + Z * p.se).toFixed(1)})${p.r2 ? " · R2 sample" : ""}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {ends.map(e => (
        <text key={e.key} x={x(e.yr) + 8} y={e.ly + 3}
          style={{ fill: e.color, fontWeight: 500 }}>{e.label} {e.v.toFixed(0)}</text>
      ))}
    </svg>
  );
}
