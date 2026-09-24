// Green = better, red = worse, on every map and chart. Ramps follow
// ColorBrewer RdYlGn with a pale midpoint; the lightness steps keep the
// order readable for most red-green color-vision deficiencies, and every
// view also carries numbers in hovers, legends and labels.

// Score: low (red) → mid (yellow) → high (green). Six bins.
export const RAMP = ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"];
export const NEUTRAL = "#e3e2dc";
export const MISSING = "#f1f0ea";
export const ABOVE = "#1a9850";   // better: significantly above / gained
export const BELOW = "#d73027";   // worse: significantly below / declined
export const SAME  = "#c6ccd2";

// Diverging: big drop → red, no change → paper, big gain → green.
export const DIVERGE = ["#d73027", "#f46d43", "#fdae61", "#f1f0ea", "#a6d96a", "#66bd63", "#1a9850"];

export function hexToRgb(h, a = 255) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

/** Sequential bin for a score within [lo, hi]. */
export function rampColor(v, lo, hi) {
  if (v == null) return MISSING;
  const t = Math.max(0, Math.min(0.9999, (v - lo) / (hi - lo)));
  return RAMP[Math.floor(t * RAMP.length)];
}

/** Diverging bin for a change, symmetric around 0 with half-width `max`. */
export function divergeColor(d, max) {
  if (d == null) return MISSING;
  const t = Math.max(-0.9999, Math.min(0.9999, d / max));
  const mid = (DIVERGE.length - 1) / 2;
  return DIVERGE[Math.round(mid + t * mid)];
}

/** Round a range outward to multiples of `step` for tidy legends. */
export function niceDomain(lo, hi, step = 5) {
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}
