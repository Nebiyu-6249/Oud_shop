// The title sequence: seven beats on one master timeline. The timeline runs
// from 0 to 1 and drives a single number, progress; every camera move and
// mechanism is a pure function of that number (see choreography.ts), so
// scrubbing backwards replays everything exactly in reverse.

export const BEATS = [
  { label: "rim", at: 0 },
  { label: "descent", at: 0.18 },
  { label: "resins", at: 0.32 },
  { label: "florals", at: 0.47 },
  { label: "ember", at: 0.64 },
  { label: "woods", at: 0.8 },
  { label: "ascent", at: 1 },
] as const;

export type BeatLabel = (typeof BEATS)[number]["label"];
export const LABELS = BEATS.map((b) => b.label) as BeatLabel[];
export const labelAt = (label: BeatLabel) => BEATS.find((b) => b.label === label)!.at;

/** The realm each station belongs to, by realm slug. */
export const REALM_LABEL: Record<string, BeatLabel> = {
  "frost-cloister": "resins",
  "still-water-garden": "florals",
  "ember-kiln": "ember",
  caravanserai: "woods",
};

/** The label nearest a progress value, and the next or previous one. */
export function nearestLabel(p: number): BeatLabel {
  let best: (typeof BEATS)[number] = BEATS[0];
  for (const b of BEATS) if (Math.abs(b.at - p) < Math.abs(best.at - p)) best = b;
  return best.label;
}

export function stepLabel(p: number, dir: 1 | -1): BeatLabel {
  const eps = 1e-4;
  if (dir > 0) return (BEATS.find((b) => b.at > p + eps) ?? BEATS[BEATS.length - 1]).label;
  return ([...BEATS].reverse().find((b) => b.at < p - eps) ?? BEATS[0]).label;
}

// ------------------------------------------------------------ pure easing

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Where x sits within [a, b], clamped to 0..1. */
export const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));

/** Long, smooth camera ease: zero velocity and acceleration at both ends. */
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * A ratchet: `steps` quick advances separated by holds, like a pawl catching
 * tooth after tooth. Each step moves in the first `drive` share of its slot
 * and then waits. Monotonic, so reversing the scrub runs it backwards.
 */
export function ratchet(t: number, steps: number, drive = 0.55): number {
  const x = clamp01(t) * steps;
  const i = Math.min(Math.floor(x), steps - 1);
  const f = x - i;
  const move = f >= drive ? 1 : smoother(f / drive);
  return (i + (t >= 1 ? 1 : move)) / steps;
}

/** Sequential stages over a window: stage k of n runs within its own sub-span. */
export function stage(t: number, k: number, n: number, overlap = 0.25): number {
  const w = 1 / (n - (n - 1) * overlap);
  const a = k * w * (1 - overlap);
  return span(t, a, a + w);
}

// ------------------------------------------------------------ timeline

type Gsap = typeof import("gsap").gsap;

/**
 * The master timeline: one linear tween of progress from 0 to 1, with the
 * beat labels on it. The home page scrubs it with ScrollTrigger; other
 * routes play it between labels with tweenFromTo.
 */
export function createMasterTimeline(gsap: Gsap, onProgress: (p: number) => void) {
  const proxy = { p: 0 };
  const tl = gsap.timeline({ paused: true });
  tl.to(proxy, { p: 1, duration: 1, ease: "none", onUpdate: () => onProgress(proxy.p) });
  for (const b of BEATS) tl.addLabel(b.label, b.at);
  return tl;
}
