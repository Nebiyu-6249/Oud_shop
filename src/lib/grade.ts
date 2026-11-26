// The colour grade as a pure function of progress: the realm palettes for
// the DOM overlays, and the lamp's colour temperature and strength for the
// stage. Keyframes sit on the beat labels and blend smoothly between them.

import type { Palette } from "./palette";
import { BEATS, type BeatLabel, REALM_LABEL, smoother, span } from "./sequence";

export const HOUSE: Palette = { base: "#0d0a07", surface: "#17120d", accent: "#b08d57", ink: "#e9dfc9", glow: "#8e2b1e" };

/** The lamp at each beat: a colour temperature and a strength (1 = the full key). */
export const LAMP: Record<BeatLabel, { color: string; strength: number }> = {
  rim: { color: "#ffb36b", strength: 1 }, // about 2700 K, a candle-warm lamp
  descent: { color: "#ffb36b", strength: 0.95 },
  resins: { color: "#dde5f5", strength: 0.9 }, // cold, about 6000 K, for the cloister
  florals: { color: "#ffe2b8", strength: 1 }, // morning, about 4200 K
  ember: { color: "#ff9a55", strength: 0.16 }, // the brazier takes over
  woods: { color: "#ffc68c", strength: 1 }, // late sun, about 3300 K
  ascent: { color: "#ffbb78", strength: 1.05 },
};

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const toHex = (c: RGB) => `#${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")}`;
// blend in linear light, so mixes do not dip dark in the middle
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
export function mix(a: string, b: string, t: number): string {
  const A = hex(a).map(lin);
  const B = hex(b).map(lin);
  return toHex(A.map((v, i) => srgb(v + (B[i] - v) * t)) as RGB);
}

/** Which keyframes bracket p, and how far between them (eased). */
function bracket(p: number) {
  for (let i = 0; i < BEATS.length - 1; i++) {
    const a = BEATS[i];
    const b = BEATS[i + 1];
    if (p <= b.at) return { a: a.label, b: b.label, t: smoother(span(p, a.at, b.at)) };
  }
  const last = BEATS[BEATS.length - 1].label;
  return { a: last, b: last, t: 0 };
}

/** The palette at each beat: the house palette, or the realm the beat belongs to. */
export function beatPalettes(realms: Record<string, Palette>): Record<BeatLabel, Palette> {
  const out = {} as Record<BeatLabel, Palette>;
  for (const b of BEATS) {
    const slug = Object.keys(REALM_LABEL).find((s) => REALM_LABEL[s] === b.label);
    out[b.label] = (slug && realms[slug]) || HOUSE;
  }
  return out;
}

export function paletteAt(p: number, palettes: Record<BeatLabel, Palette>): Palette {
  const { a, b, t } = bracket(p);
  const A = palettes[a];
  const B = palettes[b];
  return {
    base: mix(A.base, B.base, t),
    surface: mix(A.surface, B.surface, t),
    accent: mix(A.accent, B.accent, t),
    ink: mix(A.ink, B.ink, t),
    glow: mix(A.glow, B.glow, t),
  };
}

export function lampAt(p: number) {
  const { a, b, t } = bracket(p);
  return { color: mix(LAMP[a].color, LAMP[b].color, t), strength: LAMP[a].strength + (LAMP[b].strength - LAMP[a].strength) * t };
}
