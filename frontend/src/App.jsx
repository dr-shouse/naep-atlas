import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  assessments, ASSESSMENT_KEYS, stateIndex, yearRows, nation, point,
  prevYear, snapYear, fmt1, signed,
} from "./lib/data";
import { diffTest, rankRanges } from "./lib/stats";
import { ABOVE, BELOW } from "./lib/color";
import YearScrubber from "./components/YearScrubber";
import TipJar from "./components/TipJar";
import Change from "./views/Change";
import Rankings from "./views/Rankings";
import About from "./views/About";

// deck.gl + MapLibre live in their own chunk and load on first map view.
const MapView = lazy(() => import("./views/MapView"));
const Timelapse = lazy(() => import("./views/Timelapse"));

const TABS = [
  { id: "map",      label: "Map"        },
  { id: "timelapse", label: "Time-lapse" },
  { id: "change",   label: "Change"     },
  { id: "rankings", label: "Rankings"   },
  { id: "about",    label: "About"      },
];

// Shareable state lives in the query string: ?a=math-8&y=2024&s=KY&t=map
function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const a = ASSESSMENT_KEYS.includes(q.get("a")) ? q.get("a") : "reading-4";
  const years = assessments[a].years;
  const y = +q.get("y");
  return {
    a,
    year: years.includes(y) ? y : years.at(-1),
    sel: stateIndex[q.get("s")] ? q.get("s") : "KY",
    tab: TABS.some(t => t.id === q.get("t")) ? q.get("t") : "map",
    compare: (q.get("c") || "").split(",").filter(c => stateIndex[c]).slice(0, 5),
  };
}

export default function App() {
  const init = useMemo(readUrl, []);
  const [a, setA]             = useState(init.a);
  const [year, setYear]       = useState(init.year);
  const [sel, setSel]         = useState(init.sel);
  const [tab, setTab]         = useState(init.tab);
  const [compare, setCompare] = useState(init.compare);

  useEffect(() => {
    const q = new URLSearchParams({ a, y: year, s: sel, t: tab });
    if (compare.length) q.set("c", compare.join(","));
    window.history.replaceState({}, "", `${window.location.pathname}?${q}`);
  }, [a, year, sel, tab, compare]);

  const switchAssessment = k => { setA(k); setYear(y => snapYear(k, y)); };
  const selectState = code => { setSel(code); setCompare(c => c.filter(x => x !== code)); };

  const A = assessments[a];
  const ranked = useMemo(() => rankRanges(yearRows(a, year)), [a, year]);
  const n = nation(a, year);
  const missing = useMemo(
    () => Object.values(stateIndex).filter(s => !ranked.some(r => r.code === s.code)),
    [ranked]
  );

  const p = point(a, sel, year);
  const vsN = p ? diffTest(p, n) : null;
  const py = prevYear(a, year);
  const q = py ? point(a, sel, py) : null;
  const chg = p && q ? diffTest(p, q) : null;
  const rr = ranked.find(r => r.code === sel);

  const showScrubber = tab === "map" || tab === "rankings";

  return (
    <>
      <aside className="rail">
        <div className="rail-brand">
          <h1>NAEP Atlas</h1>
          <p>neverlost.studio · NAEP 1990–2024</p>
          <div className="assess-grid" role="group" aria-label="Assessment">
            {ASSESSMENT_KEYS.map(k => (
              <button key={k} className={k === a ? "on" : ""} onClick={() => switchAssessment(k)}>
                {assessments[k].subject === "math" ? "Math" : "Reading"} <b>{assessments[k].grade}</b>
              </button>
            ))}
          </div>
        </div>
        <div className="rail-head">
          <span>{year} · {ranked.length} tested</span>
          <span>nation {n?.value.toFixed(0)}</span>
        </div>
        <div className="rail-list">
          {ranked.map(r => {
            const t = diffTest(r, n);
            return (
              <button key={r.code} className={"rail-row" + (r.code === sel ? " active" : "")}
                onClick={() => selectState(r.code)}>
                <span className="code">{r.code}</span>
                <span className="name">
                  {r.name}<br />
                  <span style={{ color: t.dir > 0 ? ABOVE : t.dir < 0 ? BELOW : "var(--ink-faint)" }}>
                    {t.dir > 0 ? "above nation" : t.dir < 0 ? "below nation" : "≈ nation"}
                  </span>
                </span>
                <span className="mi">{r.value.toFixed(0)}<small>#{r.best === r.worst ? r.best : `${r.best}–${r.worst}`}</small></span>
              </button>
            );
          })}
          {missing.map(s => (
            <button key={s.code} className={"rail-row absent" + (s.code === sel ? " active" : "")}
              onClick={() => selectState(s.code)}>
              <span className="code">{s.code}</span>
              <span className="name">{s.name}<br /><span>did not participate</span></span>
              <span className="mi">—</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          {TABS.map(t => (
            <button key={t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
          <span className="spacer" />
          <span className="topbar-meta">{A.label}</span>
          <TipJar />
        </div>

        <div className="canvas">
          {tab !== "about" && (
            <div className="stat-strip">
              <Stat label={stateIndex[sel]?.name ?? sel} value={p ? fmt1(p.value) : "—"}
                note={p ? `${year} · ±${(1.96 * p.se).toFixed(1)} (95%)` : `not tested in ${year}`} />
              <Stat label="vs nation" value={vsN ? signed(vsN.d) : "—"}
                color={vsN?.dir > 0 ? ABOVE : vsN?.dir < 0 ? BELOW : undefined}
                note={vsN ? (vsN.sig ? "significant" : "not significant") : ""} />
              <Stat label={py ? `since ${py}` : "since last cycle"} value={chg ? signed(chg.d) : "—"}
                color={chg?.dir > 0 ? ABOVE : chg?.dir < 0 ? BELOW : undefined}
                note={chg ? (chg.sig ? "significant" : "not significant") : py ? "no prior score" : "first cycle"} />
              <Stat label="rank range" value={rr ? (rr.best === rr.worst ? rr.best : `${rr.best}–${rr.worst}`) : "—"}
                note={rr ? `point-estimate rank ${rr.rank} of ${ranked.length}` : ""} />
            </div>
          )}

          {showScrubber && (
            <YearScrubber years={A.years} year={year} setYear={setYear} r2Years={A.r2_years} />
          )}

          {tab === "map" && (
            <Suspense fallback={<Loading />}>
              <MapView a={a} year={year} setYear={setYear} selected={sel} setSelected={selectState}
                compare={compare} setCompare={setCompare} />
            </Suspense>
          )}
          {tab === "timelapse" && (
            <Suspense fallback={<Loading />}>
              <Timelapse a={a} year={year} setYear={setYear} selected={sel} setSelected={selectState} />
            </Suspense>
          )}
          {tab === "change" && <Change a={a} selected={sel} setSelected={selectState} />}
          {tab === "rankings" && <Rankings a={a} year={year} selected={sel} setSelected={selectState} />}
          {tab === "about" && <About />}

          <footer className="foot">
            Source: NAEP Data Service (NCES), public schools, all students. Built by Michael Shouse, PhD · NeverLost Studio.
          </footer>
        </div>
      </div>
    </>
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

function Loading() {
  return <div className="loading">Loading map…</div>;
}
