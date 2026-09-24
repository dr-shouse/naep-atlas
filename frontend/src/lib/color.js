// Palette shared with Sundays: jet blues for magnitude, safety orange for
// the "bad" side of a diverging scale. Orange/blue stays readable for the
// common forms of color-vision deficiency.

export const RAMP = ["#e6f1fb", "#b5d4f4", "#85b7eb", "#378add", "#185fa5", "#0c447c"];
export const NEUTRAL = "#e3e2dc";
export const MISSING = "#f1f0ea";
export const ABOVE = "#185fa5";
export const BELOW = "#e2540f";
export const SAME  = "#c6ccd2";

// Diverging: big drop → orange, no change → paper, big gain → blue.
export const DIVERGE = ["#b8430b", "#e2540f", "#f2a57d", "#f1f0ea", "#85b7eb", "#378add", "#185fa5"];

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
