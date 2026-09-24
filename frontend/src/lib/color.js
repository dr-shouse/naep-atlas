// Color palettes. Every view reads the exported names below; they are live
// ES-module bindings, so setPalette() swaps them everywhere and the next
// render picks them up. Components that memoize colors include PALETTE_ID
// in their dependencies.
//
// In each palette, "above" / the high end = better, "below" / the low
// end = worse.

export const PALETTES = {
  viridis: {
    label: "Viridis",
    safe: true,
    // matplotlib viridis, 6 samples: low (purple) → high (yellow)
    ramp: ["#440154", "#414487", "#2a788e", "#22a884", "#7ad151", "#fde725"],
    above: "#1f9e89",
    below: "#482878",
    // drop: deep → pale purple · no change · gain: pale yellow → deep teal
    diverge: ["#440154", "#5b3c8f", "#a896cc", "#f1f0ea", "#c8e020", "#5ec962", "#21918c"],
  },
  blueorange: {
    label: "Blue / orange",
    safe: true,
    ramp: ["#e6f1fb", "#b5d4f4", "#85b7eb", "#378add", "#185fa5", "#0c447c"],
    above: "#185fa5",
    below: "#e2540f",
    diverge: ["#b8430b", "#e2540f", "#f2a57d", "#f1f0ea", "#85b7eb", "#378add", "#185fa5"],
  },
  redgreen: {
    label: "Red / green",
    safe: false,
    // ColorBrewer RdYlGn
    ramp: ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"],
    above: "#1a9850",
    below: "#d73027",
    diverge: ["#d73027", "#f46d43", "#fdae61", "#f1f0ea", "#a6d96a", "#66bd63", "#1a9850"],
  },
};
export const PALETTE_KEYS = Object.keys(PALETTES);
export const DEFAULT_PALETTE = "viridis";

export const NEUTRAL = "#e3e2dc";
export const MISSING = "#f1f0ea";
export const SAME = "#c6ccd2";

export let PALETTE_ID = DEFAULT_PALETTE;
export let RAMP = PALETTES[DEFAULT_PALETTE].ramp;
export let ABOVE = PALETTES[DEFAULT_PALETTE].above;   // better
export let BELOW = PALETTES[DEFAULT_PALETTE].below;   // worse
export let DIVERGE = PALETTES[DEFAULT_PALETTE].diverge;

export function setPalette(id) {
  const p = PALETTES[id] ?? PALETTES[DEFAULT_PALETTE];
  PALETTE_ID = PALETTES[id] ? id : DEFAULT_PALETTE;
  RAMP = p.ramp;
  ABOVE = p.above;
  BELOW = p.below;
  DIVERGE = p.diverge;
}

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
