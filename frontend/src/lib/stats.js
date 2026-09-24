// Significance testing from published means and standard errors.
//
// NCES tests differences with t-statistics built from the two standard
// errors; for independent samples (two states, or one state in two years)
// that is d / sqrt(se1² + se2²). We use the normal critical value 1.96
// (α = .05, two-sided) without multiple-comparison adjustment and without
// the linking error NCES adds to some cross-framework comparisons, so a
// handful of borderline calls may differ from the official NAEP Data
// Explorer. State vs nation is treated as independent too; the state is
// part of the national sample, which makes this slightly conservative.

export const Z = 1.96;

export function diffTest(a, b) {
  if (!a || !b) return null;
  const d = a.value - b.value;
  const se = Math.sqrt(a.se ** 2 + b.se ** 2);
  const z = d / se;
  return { d, se, z, sig: Math.abs(z) > Z, dir: Math.abs(z) > Z ? Math.sign(d) : 0 };
}

/** 95% confidence interval for one mean. */
export const ci = p => [p.value - Z * p.se, p.value + Z * p.se];

/**
 * Rank ranges: for each state, best = 1 + (states significantly higher),
 * worst = N − (states significantly lower). A state "ranked 12th" by its
 * point estimate might honestly be anywhere from 6th to 19th.
 */
export function rankRanges(rows) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const n = sorted.length;
  return sorted.map((r, i) => {
    let higher = 0, lower = 0;
    for (const o of sorted) {
      if (o === r) continue;
      const t = diffTest(o, r);
      if (t.dir > 0) higher++;
      else if (t.dir < 0) lower++;
    }
    return { ...r, rank: i + 1, best: higher + 1, worst: n - lower };
  });
}

/** Label for a state-vs-nation (or any) comparison. */
export function sigLabel(t, words = ["higher", "not sig. different", "lower"]) {
  if (!t) return "—";
  return t.dir > 0 ? words[0] : t.dir < 0 ? words[2] : words[1];
}
