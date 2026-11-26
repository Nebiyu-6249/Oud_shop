// The astrolabe, described once and drawn twice: as SVG (the fallback and the
// first paint) and as canvas textures on the WebGL brass. Everything is in
// unit coordinates, SVG convention: origin at the pivot, y down, the throne
// (kursi) at the top. Angles are degrees, 0 pointing right, clockwise positive.

import {
  type P,
  type Stroke,
  arc,
  circle,
  cubicAt,
  leaf,
  line,
  polar,
  poly,
  smooth,
} from "@/components/flacon/kit";

export const R = {
  limbOuter: 0.86,
  limbInner: 0.75,
  markRing: 0.775,
  scaleInner: 0.8,
  scaleOuter: 0.84,
  reteOuter: 0.735,
  reteInner: 0.55,
  wearOuter: 0.535,
  wearInner: 0.365,
  plate: 0.35,
  pin: 0.03,
} as const;

/** Where a pointer lands, by radius. */
export type RingId = "rete" | "wear" | "plate";
export function ringAt(r: number): RingId | null {
  if (r > R.reteOuter + 0.02) return null;
  if (r >= R.reteInner) return "rete";
  if (r >= R.wearInner) return "wear";
  if (r >= 0.06) return "plate";
  return null;
}

/** Ring-local angle of detent i on a ring with n detents (detent 0 at the top). */
export const detentAngle = (i: number, n: number) => -90 + (360 * i) / n;

/** The 12 inlaid marks on the limb, one per fragrance, offset from the throne. */
export const MARKS = 12;
export const markAngle = (k: number) => -90 + 15 + (360 * k) / MARKS;

export type EngravedText = {
  text: string;
  x: number;
  y: number;
  /** Degrees, applied about (x, y). */
  rotate: number;
  size: number;
  font: "display" | "body";
};

export type Layer = {
  /** Closed outline of the part (for fill and for the 3D extrusion). */
  outline: P[];
  /** Inner hole, if the part is a ring. */
  hole?: P[];
  /** When the part is round: its radii, so SVG can draw true circles. */
  round?: { outer: number; inner?: number };
  strokes: Stroke[];
  texts: EngravedText[];
};

const circlePts = (r: number, n = 128, c: P = [0, 0]): P[] =>
  Array.from({ length: n }, (_, i) => polar(c, r, (360 * i) / n));

/** Text set along a ring, reading upright when its detent is at the top. */
function ringText(text: string, r: number, angle: number, size: number, font: EngravedText["font"]): EngravedText {
  const [x, y] = polar([0, 0], r, angle);
  return { text, x, y, rotate: angle + 90, size, font };
}

/** A notch on the outer edge that marks a detent. */
function detentNotch(r: number, angle: number, depth = 0.018): Stroke {
  const tip = polar([0, 0], r - depth, angle);
  return { d: poly([polar([0, 0], r, angle - 2.2), tip, polar([0, 0], r, angle + 2.2)]) };
}

/**
 * A circular band in the manner of Kufic inscription: radial ascenders with
 * split tips and low square bodies on a baseline. Abstract, not legible.
 */
export function kuficBand(rIn: number, rOut: number, from: number, to: number, unit: number): Stroke[] {
  const out: Stroke[] = [{ d: arc([0, 0], rIn, from, to) }];
  const h = rOut - rIn;
  for (let a = from + unit * 0.3, i = 0; a < to - unit * 0.3; a += unit, i++) {
    const kind = (i * 5 + 2) % 4;
    const at = (r: number, da = 0) => polar([0, 0], r, a + da);
    if (kind === 0 || kind === 2) {
      out.push({ d: line(at(rIn), at(rOut - h * 0.15)) });
      out.push({ d: `M${at(rOut - h * 0.15).join(" ")}Q${at(rOut, -unit * 0.18).join(" ")} ${at(rOut - h * 0.25, -unit * 0.22).join(" ")}` });
      out.push({ d: `M${at(rOut - h * 0.15).join(" ")}Q${at(rOut, unit * 0.18).join(" ")} ${at(rOut - h * 0.25, unit * 0.22).join(" ")}` });
    } else if (kind === 1) {
      out.push({ d: poly([at(rIn, unit * 0.15), at(rIn + h * 0.45, unit * 0.15), at(rIn + h * 0.45, unit * 0.5), at(rIn, unit * 0.5)]) });
    } else {
      out.push({ d: poly([at(rIn, -unit * 0.1), at(rIn + h * 0.3, -unit * 0.1), at(rIn + h * 0.3, unit * 0.3), at(rIn + h * 0.7, unit * 0.3)]) });
    }
  }
  return out;
}

export const star8 = (c: P, r: number) => {
  const pts: P[] = [];
  for (let i = 0; i < 16; i++) pts.push(polar(c, i % 2 ? r * 0.45 : r, i * 22.5 - 90));
  return poly(pts, true);
};

// ---------------------------------------------------------------- mater

/** The throne at the top, as cubic sections from the limb up to the apex. */
function kursiRight(): P[] {
  const segs: [P, P, P, P][] = [
    [[0.19, -0.838], [0.24, -0.9], [0.15, -0.93], [0.105, -0.925]],
    [[0.105, -0.925], [0.12, -0.96], [0.06, -0.99], [0.035, -0.965]],
    [[0.035, -0.965], [0.03, -0.985], [0.012, -0.998], [0, -0.998]],
  ];
  const pts: P[] = [];
  for (const s of segs) for (let i = 0; i < 14; i++) pts.push(cubicAt(...s, i / 14));
  pts.push([0, -0.998]);
  return pts;
}

export function mater(markLabels: string[]): Layer {
  const right = kursiRight();
  const leftUp = right.map(([x, y]) => [-x, y] as P);
  const rightDown = [...right].reverse();
  const a0 = (Math.asin(right[0][0] / R.limbOuter) * 180) / Math.PI;
  const body: P[] = [];
  // round the limb clockwise from the right foot of the throne to the left
  // foot, then up over the throne and back down to the right foot
  for (let a = -90 + a0; a <= 270 - a0 + 1e-9; a += (360 - 2 * a0) / 140) body.push(polar([0, 0], R.limbOuter, a));
  const outline = [...body, ...leftUp.slice(1), ...rightDown.slice(1, -1)];

  const strokes: Stroke[] = [
    { d: circle([0, 0], R.limbInner) },
    { d: circle([0, 0], R.scaleInner), fine: true },
    { d: circle([0, 0], R.scaleOuter), fine: true },
  ];
  for (let a = 0; a < 360; a += 5) {
    const long = a % 15 === 0;
    strokes.push({
      d: line(polar([0, 0], R.scaleInner, a), polar([0, 0], long ? R.limbOuter - 0.008 : R.scaleOuter, a)),
      fine: !long,
    });
  }
  // the index under the throne: whatever sits beneath it is the setting
  strokes.push({ d: poly([polar([0, 0], R.limbInner, -93), polar([0, 0], R.limbInner - 0.03, -90), polar([0, 0], R.limbInner, -87)], true) });
  for (let k = 0; k < MARKS; k++) strokes.push({ d: star8(polar([0, 0], R.markRing, markAngle(k)), 0.016), fine: true });
  // throne: an inner outline, a shackle hole and a small vine
  strokes.push({ d: smooth(kursiRight().map(([x, y]) => [x * 0.78, y + 0.01] as P)), fine: true });
  strokes.push({ d: smooth(kursiRight().map(([x, y]) => [-x * 0.78, y + 0.01] as P)), fine: true });
  strokes.push({ d: circle([0, -0.955], 0.018) });
  strokes.push(...leaf([0, -0.88], -150, 0.06, 0.016, { veins: 0 }), ...leaf([0, -0.88], -30, 0.06, 0.016, { veins: 0 }));

  const texts = markLabels.map((label, k) => {
    const a = markAngle(k);
    const [x, y] = polar([0, 0], (R.limbInner + R.scaleInner) / 2 + 0.0, a + 6.5);
    return { text: label, x, y, rotate: a + 90, size: 0.022, font: "body" as const };
  });
  return { outline, strokes, texts };
}

// ---------------------------------------------------------------- rete

export function rete(labels: string[]): Layer {
  const n = labels.length;
  const strokes: Stroke[] = [
    { d: circle([0, 0], R.reteOuter - 0.012), fine: true },
    { d: circle([0, 0], R.reteInner + 0.012), fine: true },
  ];
  const texts: EngravedText[] = [];
  const mid = (R.reteOuter + R.reteInner) / 2;
  for (let i = 0; i < n; i++) {
    const a = detentAngle(i, n);
    texts.push(ringText(labels[i], mid, a, 0.068, "display"));
    strokes.push(detentNotch(R.reteOuter, a));
    // a star pointer between families, as on a real rete, with interlace
    const b = a + 180 / n;
    const base = polar([0, 0], R.reteInner + 0.03, b);
    const tip = polar([0, 0], R.reteOuter - 0.025, b);
    strokes.push(...leaf(base, b, Math.hypot(tip[0] - base[0], tip[1] - base[1]), 0.022, { veins: 0 }));
    strokes.push({ d: circle(base, 0.012) });
    strokes.push({ d: arc([0, 0], mid - 0.035, b - 22, b - 8), fine: true });
    strokes.push({ d: arc([0, 0], mid + 0.035, b + 8, b + 22), fine: true });
    strokes.push({ d: arc([0, 0], mid + 0.035, b - 22, b - 8), fine: true });
    strokes.push({ d: arc([0, 0], mid - 0.035, b + 8, b + 22), fine: true });
  }
  return { outline: circlePts(R.reteOuter), hole: circlePts(R.reteInner), round: { outer: R.reteOuter, inner: R.reteInner }, strokes, texts };
}

// ---------------------------------------------------------------- wear ring

export type WearSymbol = "day" | "any" | "night";

function wearSymbol(kind: WearSymbol, c: P, r: number): Stroke[] {
  if (kind === "day") {
    const out: Stroke[] = [{ d: circle(c, r * 0.5) }];
    for (let i = 0; i < 8; i++) out.push({ d: line(polar(c, r * 0.7, i * 45), polar(c, r, i * 45)) });
    return out;
  }
  if (kind === "night") {
    return [{ d: `${arc(c, r, -60, 240)}A${r * 0.8} ${r * 0.8} 0 1 0 ${polar(c, r, -60).join(" ")}` }];
  }
  // either: a disc half engraved with hatching
  const out: Stroke[] = [{ d: circle(c, r * 0.8) }, { d: line([c[0], c[1] - r * 0.8], [c[0], c[1] + r * 0.8]) }];
  for (let k = 1; k < 5; k++) {
    const dx = (r * 0.8 * k) / 5;
    const dy = Math.sqrt((r * 0.8) ** 2 - dx ** 2);
    out.push({ d: line([c[0] + dx, c[1] - dy], [c[0] + dx, c[1] + dy]), fine: true });
  }
  return out;
}

export function wearRing(labels: string[], symbols: WearSymbol[]): Layer {
  const n = labels.length;
  const strokes: Stroke[] = [
    { d: circle([0, 0], R.wearOuter - 0.012), fine: true },
    { d: circle([0, 0], R.wearInner + 0.012), fine: true },
  ];
  const texts: EngravedText[] = [];
  const step = 360 / n;
  for (let i = 0; i < n; i++) {
    const a = detentAngle(i, n);
    strokes.push(detentNotch(R.wearOuter, a));
    // symbol, then rotated into place about the pivot
    const c = polar([0, 0], 0.49, a);
    strokes.push(...wearSymbol(symbols[i], c, 0.022));
    texts.push(ringText(labels[i], 0.415, a, 0.05, "body"));
    strokes.push(...kuficBand(R.wearInner + 0.03, R.wearOuter - 0.035, a + 32, a + step - 32, 6));
  }
  return { outline: circlePts(R.wearOuter), hole: circlePts(R.wearInner), round: { outer: R.wearOuter, inner: R.wearInner }, strokes, texts };
}

// ---------------------------------------------------------------- plate

export function plate(labels: string[]): Layer {
  const n = labels.length;
  const strokes: Stroke[] = [{ d: circle([0, 0], R.plate - 0.012), fine: true }];
  // almucantars: the circles of equal altitude, which a planispheric
  // projection draws as nested, eccentric circles climbing to the zenith
  for (let i = 1; i <= 5; i++) {
    const r = R.plate * (0.88 - i * 0.13);
    strokes.push({ d: circle([0, -i * 0.028], r), fine: true });
  }
  const zenith: P = [0, -0.17];
  for (const dx of [-0.3, -0.15, 0.15, 0.3]) {
    strokes.push({ d: smooth([zenith, [dx * 0.5, -0.05], [dx, 0.18]]), fine: true });
  }
  strokes.push({ d: arc([0, -0.55], 0.62, 62, 118) });
  strokes.push({ d: circle([0, 0], 0.06) }, { d: circle([0, 0], R.pin) });
  const texts: EngravedText[] = [];
  for (let i = 0; i < n; i++) {
    const a = detentAngle(i, n);
    texts.push(ringText(labels[i], 0.285, a, 0.058, "display"));
    strokes.push(detentNotch(R.plate, a, 0.014));
  }
  return { outline: circlePts(R.plate), round: { outer: R.plate }, strokes, texts };
}

// ---------------------------------------------------------------- rule

/** The rule, pointing up at rotation 0. */
export function rule(): Layer {
  const outline: P[] = [
    [0, -0.845],
    [0.026, -0.66],
    [0.032, -0.06],
    [0.05, 0],
    [0.032, 0.06],
    [0.04, 0.4],
    [0.022, 0.47],
    [-0.022, 0.47],
    [-0.04, 0.4],
    [-0.032, 0.06],
    [-0.05, 0],
    [-0.032, -0.06],
    [-0.026, -0.66],
  ];
  const strokes: Stroke[] = [
    { d: line([0, -0.83], [0, -0.07]), fine: true },
    { d: circle([0, 0], 0.034) },
    { d: circle([0, 0], 0.014) },
    { d: poly([[-0.016, 0.12], [0, 0.1], [0.016, 0.12], [0, 0.36], [-0.016, 0.12]], true), fine: true },
  ];
  return { outline, strokes, texts: [] };
}

export const toPath = (pts: P[]) => poly(pts, true);
