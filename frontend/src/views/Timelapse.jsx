import { useEffect, useRef, useState } from "react";
import StateMap from "../components/StateMap";
import YearScrubber from "../components/YearScrubber";
import { assessments, nation, yearRows } from "../lib/data";
import { diffTest } from "../lib/stats";

const SPEEDS = [{ ms: 1800, label: "slow" }, { ms: 1100, label: "normal" }, { ms: 600, label: "fast" }];

export default function Timelapse({ a, year, setYear, selected, setSelected }) {
  const A = assessments[a];
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1100);
  const [metric, setMetric] = useState("score");
  const yearRef = useRef(year);
  yearRef.current = year;

  // One interval; reads the live year through a ref so there's no stale
  // closure, and restarts cleanly when speed or assessment changes.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const i = A.years.indexOf(yearRef.current);
      if (i >= A.years.length - 1) { setPlaying(false); return; }
      setYear(A.years[i + 1]);
    }, speed);
    return () => clearInterval(id);
  }, [playing, speed, A, setYear]);

  const play = () => {
    if (A.years.indexOf(year) >= A.years.length - 1) setYear(A.years[0]);
    setPlaying(true);
  };

  const n = nation(a, year);
  const rows = yearRows(a, year);
  const vs = rows.map(r => diffTest(r, n));
  const above = vs.filter(t => t.dir > 0).length, below = vs.filter(t => t.dir < 0).length;

  return (
    <div className="stack">
      <YearScrubber years={A.years} year={year} r2Years={A.r2_years}
        setYear={y => { setPlaying(false); setYear(y); }}>
        <button className="play" onClick={playing ? () => setPlaying(false) : play} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <select value={speed} onChange={e => setSpeed(+e.target.value)} aria-label="Speed" className="mini-select">
          {SPEEDS.map(s => <option key={s.ms} value={s.ms}>{s.label}</option>)}
        </select>
      </YearScrubber>

      <div className="panel">
        <div className="panel-head">
          <div className="big-year">
            <span>{year}</span>
            <small>
              {A.label} · nation {n.value.toFixed(0)} · {rows.length} jurisdictions
              {metric === "nation" && ` · ${above} above, ${below} below`}
              {A.r2_years.includes(year) && " · R2 sample"}
            </small>
          </div>
          <div className="seg-toggle" role="group" aria-label="Map metric">
            <button className={metric === "score" ? "on" : ""} onClick={() => setMetric("score")}>Average score</button>
            <button className={metric === "nation" ? "on" : ""} onClick={() => setMetric("nation")}>Compared with nation</button>
          </div>
        </div>
        <StateMap a={a} year={year} metric={metric} selected={selected} onSelect={setSelected} height={520} />
      </div>
    </div>
  );
}
