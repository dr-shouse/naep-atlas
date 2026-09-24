// The Sundays week scrubber, re-cut for assessment cycles. Segments are
// equal width (cycles are irregular: 1990, 1992, 1996 … 2022, 2024).
// Hatched segments = R2 years (accommodations not permitted).
export default function YearScrubber({ years, year, setYear, r2Years = [], children, label = "Assessment" }) {
  const idx = years.indexOf(year);
  return (
    <div className="scrubber">
      <span className="wk-label">{label} <b>{year}</b></span>
      {children}
      <div className="strip" role="group" aria-label="Assessment year selector">
        {years.map((y, i) => {
          const r2 = r2Years.includes(y);
          return (
            <button key={y}
              className={"seg" + (i <= idx ? " flown" : "") + (y === year ? " current" : "") + (r2 ? " r2" : "")}
              title={r2 ? `${y} · accommodations not permitted (R2 sample)` : String(y)}
              aria-label={`Select ${y}`}
              aria-pressed={y === year}
              onClick={() => setYear(y)}>
              <span className="tick">{"’" + String(y).slice(2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
