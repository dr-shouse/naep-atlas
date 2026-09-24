import { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer, TextLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import geo from "../data/us-states.json";
import { assessments, states, point, nation, prevYear, fmt1, signed } from "../lib/data";
import { diffTest, sigLabel } from "../lib/stats";
import {
  rampColor, divergeColor, hexToRgb, niceDomain,
  RAMP, DIVERGE, ABOVE, BELOW, SAME, MISSING,
} from "../lib/color";

// No basemap tiles: a state choropleth reads better on plain paper, and
// Alaska/Hawaii are drawn as insets (see etl/build_atlas.py), which a real
// basemap would contradict. MapLibre still drives the camera.
const PAPER_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "paper", type: "background", paint: { "background-color": "#fafaf7" } }],
};

const TINY = new Set(["DC", "RI", "DE", "CT", "MD", "NH", "VT", "NJ", "MA"]);
const CHANGE_MAX = 10; // scale points at the ends of the diverging ramp

/** Zoom that fits the lower 48 + insets into a w×h box (Web Mercator). */
function fitView(w, h) {
  const zw = Math.log2((w * 360) / (62 * 512));
  const zh = Math.log2((h * 360) / (40 * 512));
  return { longitude: -96.3, latitude: 37.2, zoom: Math.max(1.5, Math.min(zw, zh)), pitch: 0, bearing: 0 };
}

export function describe(a, year, code, metric) {
  const p = point(a, code, year);
  if (!p) return { color: MISSING, alpha: 255, p: null };
  if (metric === "nation") {
    const t = diffTest(p, nation(a, year));
    return { color: t.dir > 0 ? ABOVE : t.dir < 0 ? BELOW : SAME, alpha: 255, p, t };
  }
  if (metric === "change") {
    const py = prevYear(a, year);
    const q = py ? point(a, code, py) : null;
    if (!q) return { color: MISSING, alpha: 255, p, t: null };
    const t = diffTest(p, q);
    return { color: divergeColor(t.d, CHANGE_MAX), alpha: t.sig ? 255 : 110, p, t, py };
  }
  const [lo, hi] = niceDomain(...assessments[a].domain);
  return { color: rampColor(p.value, lo, hi), alpha: 255, p };
}

export default function StateMap({ a, year, metric = "score", selected, compare = [], onSelect, height = 420 }) {
  const box = useRef(null);
  const [view, setView] = useState(() => fitView(800, height));
  const [hover, setHover] = useState(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  const down = useRef(null);
  const deck = useRef(null);
  // Clicks are picked on pointer-up here rather than via deck's own onClick, which
  // proved unreliable inside this layout. A press that moved > 4px is a pan.
  const onPointerDown = e => { down.current = [e.clientX, e.clientY]; };
  const onPointerUp = e => {
    const d = down.current; down.current = null;
    if (!d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 4) return;
    const r = box.current.getBoundingClientRect();
    const hit = deck.current?.pickObject({ x: e.clientX - r.left, y: e.clientY - r.top, radius: 2 });
    const code = hit?.object?.properties?.code;
    if (code) onSelect?.(code);
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => { setView(fitView(e.contentRect.width, e.contentRect.height)); setZoomedIn(false); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fills = useMemo(() => {
    const m = {};
    for (const s of states) {
      const d = describe(a, year, s.code, metric);
      m[s.code] = hexToRgb(d.color, d.alpha);
    }
    return m;
  }, [a, year, metric]);

  const layers = [
    new GeoJsonLayer({
      id: "states",
      data: geo,
      filled: true,
      stroked: true,
      getFillColor: f => fills[f.properties.code] ?? hexToRgb(MISSING),
      getLineColor: f =>
        f.properties.code === selected ? [18, 38, 58, 255]
        : compare.includes(f.properties.code) ? [18, 38, 58, 200]
        : [255, 255, 255, 255],
      getLineWidth: f => (f.properties.code === selected ? 2.5 : compare.includes(f.properties.code) ? 1.8 : 0.8),
      lineWidthUnits: "pixels",
      pickable: true,
      autoHighlight: true,
      highlightColor: [18, 38, 58, 40],
      onHover: info => setHover(info.object ? { code: info.object.properties.code, x: info.x, y: info.y } : null),
      updateTriggers: { getFillColor: [fills], getLineColor: [selected, compare], getLineWidth: [selected, compare] },
      transitions: { getFillColor: 450 },
    }),
    new TextLayer({
      id: "labels",
      // Tiny Northeast states get no label until zoomed in (hover still works).
      data: zoomedIn ? states : states.filter(s => !TINY.has(s.code)),
      getPosition: s => [s.lon, s.lat],
      getText: s => s.code,
      getSize: 10,
      getColor: s => {
        const f = fills[s.code];
        // dark text on light fills, white on the two darkest blues
        const lum = f ? (0.299 * f[0] + 0.587 * f[1] + 0.114 * f[2]) * (f[3] / 255) + 255 * (1 - f[3] / 255) : 255;
        return lum < 120 ? [255, 255, 255, 230] : [18, 38, 58, 200];
      },
      fontFamily: "IBM Plex Mono, monospace",
      fontWeight: 500,
      updateTriggers: { getColor: [fills] },
      pickable: false,
    }),
  ];

  const h = hover && describe(a, year, hover.code, metric);
  const hs = hover && states.find(s => s.code === hover.code);

  return (
    <div>
      <div ref={box} className="map-box" style={{ height }} onPointerDownCapture={onPointerDown} onPointerUpCapture={onPointerUp}>
        <DeckGL
          ref={deck}
          initialViewState={view}
          onViewStateChange={({ viewState }) => setZoomedIn(viewState.zoom >= 4.3)}
          controller={{ scrollZoom: false, dragRotate: false, touchRotate: false }}
          layers={layers}
          getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
          style={{ position: "absolute", inset: 0 }}
        >
          <Map mapStyle={PAPER_STYLE} reuseMaps attributionControl={false} interactive={false} />
        </DeckGL>
        <button className="map-reset" title="Reset view"
          onClick={() => { const r = box.current.getBoundingClientRect(); setView(fitView(r.width, r.height)); setZoomedIn(false); }}>
          ⟲
        </button>
        {h && hs && (
          <div className="map-tip" style={{ left: Math.min(hover.x + 14, (box.current?.clientWidth ?? 600) - 230), top: hover.y + 14 }}>
            <strong>{hs.name}</strong>
            {h.p ? (
              <>
                <div>{year}: <b>{fmt1(h.p.value)}</b> <span className="muted">± {(1.96 * h.p.se).toFixed(1)}</span>{h.p.r2 && <span className="muted"> · R2</span>}</div>
                <TipDetail a={a} year={year} code={hover.code} p={h.p} />
              </>
            ) : <div className="muted">Did not participate in {year}</div>}
          </div>
        )}
      </div>
      <Legend a={a} metric={metric} year={year} />
    </div>
  );
}

function TipDetail({ a, year, code, p }) {
  const n = diffTest(p, nation(a, year));
  const py = prevYear(a, year);
  const q = py ? point(a, code, py) : null;
  const c = q ? diffTest(p, q) : null;
  return (
    <>
      <div>vs nation: {signed(n.d)} <span className={n.dir ? "" : "muted"}>({sigLabel(n)})</span></div>
      {c && <div>since {py}: {signed(c.d)} <span className={c.sig ? "" : "muted"}>({c.sig ? "significant" : "not significant"})</span></div>}
    </>
  );
}

function Legend({ a, metric, year }) {
  if (metric === "nation") {
    return (
      <div className="legend">
        <span className="key"><span className="swatch" style={{ background: ABOVE }} />significantly above nation</span>
        <span className="key"><span className="swatch" style={{ background: SAME }} />not significantly different</span>
        <span className="key"><span className="swatch" style={{ background: BELOW }} />significantly below</span>
        <span className="key"><span className="swatch" style={{ background: MISSING, border: "1px solid var(--rule)" }} />did not participate</span>
      </div>
    );
  }
  if (metric === "change") {
    const py = prevYear(a, year);
    return (
      <div className="legend">
        <span>{py ? `${py} → ${year}` : "first cycle: no prior year"}</span>
        {DIVERGE.map((c, i) => (
          <span key={c} className="key">
            <span className="swatch" style={{ background: c, border: c === "#f1f0ea" ? "1px solid var(--rule)" : 0 }} />
            {i === 0 ? `−${CHANGE_MAX}` : i === DIVERGE.length - 1 ? `+${CHANGE_MAX}` : i === 3 ? "0" : ""}
          </span>
        ))}
        <span className="key">faded = change not significant</span>
      </div>
    );
  }
  const [lo, hi] = niceDomain(...assessments[a].domain);
  const step = (hi - lo) / RAMP.length;
  return (
    <div className="legend">
      {RAMP.map((c, i) => (
        <span key={c} className="key">
          <span className="swatch" style={{ background: c }} />
          {Math.round(lo + i * step)}{i === RAMP.length - 1 ? "+" : ""}
        </span>
      ))}
      <span className="key">scale fixed across all years, so colors are comparable over time</span>
    </div>
  );
}
