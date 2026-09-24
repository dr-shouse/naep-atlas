import { generated } from "../lib/data";

export default function About() {
  return (
    <div className="panel prose">
      <h2>About the data</h2>
      <p>
        NAEP Atlas shows state results from the National Assessment of Educational Progress (NAEP), the
        Nation's Report Card, for grade 4 and grade 8 reading and mathematics. Every number is an average
        scale score for all students in public schools, with its standard error, pulled from the
        <a href="https://www.nationsreportcard.gov/api_documentation.aspx" target="_blank" rel="noreferrer"> NAEP Data Service</a>{" "}
        run by NCES. The data was last refreshed {generated}.
      </p>

      <h3>Who took part</h3>
      <p>
        State participation was voluntary until 2003, so early years have gaps: 38 jurisdictions in grade 8
        math in 1990, for example. Since 2003 every state and DC takes part in every cycle. States that
        didn't participate are shown blank, never estimated.
      </p>

      <h3>Accommodations (R2 and R3 samples)</h3>
      <p>
        Before 1996 NAEP did not allow testing accommodations for students with disabilities or English
        learners (the "R2" sample). From 1996 in math and 1998 in reading, results are reported with
        accommodations permitted ("R3"). The Atlas uses R3 wherever states reported it and R2 otherwise;
        R2 years are hatched on the year strip and drawn as hollow points on trend charts. NCES presents
        both as one trend line, but small changes across that break deserve caution.
      </p>

      <h3>Statistical significance</h3>
      <p>
        NAEP is a sample survey, so every score has a margin of error. Differences are tested the way NCES
        does it in principle: the difference divided by the square root of the sum of the squared standard
        errors, significant when it exceeds 1.96 (p &lt; .05, two-sided). The Atlas does not apply the
        multiple-comparison adjustments or linking error NCES sometimes adds, so a few borderline results
        may differ from the official NAEP Data Explorer. Treat the Explorer as authoritative.
      </p>
      <p>
        Rank ranges follow from the same tests: a state's best possible rank is one more than the number of
        states significantly above it, and its worst is the number of states minus those significantly
        below it.
      </p>

      <h3>Updating</h3>
      <p>
        <code>etl/fetch_naep.py</code> pulls fresh numbers from the Data Service and{" "}
        <code>etl/build_atlas.py</code> writes the bundle this site is built from. When NAEP releases a new
        cycle, run <code>python fetch_naep.py --add-year YYYY</code>, then <code>python build_atlas.py</code>, then deploy.
      </p>
    </div>
  );
}
