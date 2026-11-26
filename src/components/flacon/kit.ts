// Small vector kit for engraved line drawings. Pure functions returning SVG
// path data. Angles are degrees, 0 pointing right (+x) and -90 pointing up.

export type P = readonly [number, number];
/** A stroked path; fine strokes are the hairline hatching of an engraving. */
export type Stroke = { d: string; fine?: boolean };

/** Rounds to 3 decimals: fine enough for a unit-sized drawing, compact for a 320-unit one. */
export const r2 = (n: number) => Math.round(n * 1000) / 1000;
export const pt = (p: P) => `${r2(p[0])} ${r2(p[1])}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Local frame: u runs along the angle, v to its right. */
export function frame(base: P, angle: number) {
  const c = Math.cos(rad(angle));
  const s = Math.sin(rad(angle));
  return (u: number, v: number): P => [base[0] + u * c - v * s, base[1] + u * s + v * c];
}

export const polar = (c: P, r: number, angle: number): P => [
  c[0] + r * Math.cos(rad(angle)),
  c[1] + r * Math.sin(rad(angle)),
];

/** Catmull-Rom spline through points, as cubic segments only (no leading M). */
export function curveSegments(ps: readonly P[], closed = false): string {
  const n = ps.length;
  if (n < 2) return "";
  const get = (i: number) => (closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))]);
  let d = "";
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

export const smooth = (ps: readonly P[], closed = false) =>
  `M${pt(ps[0])}${curveSegments(ps, closed)}${closed ? "Z" : ""}`;

export const line = (a: P, b: P) => `M${pt(a)}L${pt(b)}`;

export const poly = (ps: readonly P[], closed = false) =>
  `M${ps.map(pt).join("L")}${closed ? "Z" : ""}`;

export function circle(c: P, r: number) {
  return `M${pt([c[0] - r, c[1]])}a${r2(r)} ${r2(r)} 0 1 0 ${r2(2 * r)} 0a${r2(r)} ${r2(r)} 0 1 0 ${r2(-2 * r)} 0`;
}

export function ellipse(c: P, rx: number, ry: number) {
  return `M${pt([c[0] - rx, c[1]])}a${r2(rx)} ${r2(ry)} 0 1 0 ${r2(2 * rx)} 0a${r2(rx)} ${r2(ry)} 0 1 0 ${r2(-2 * rx)} 0`;
}

export function arc(c: P, r: number, from: number, to: number) {
  const a = polar(c, r, from);
  const b = polar(c, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  return `M${pt(a)}A${r2(r)} ${r2(r)} 0 ${large} ${sweep} ${pt(b)}`;
}

export function cubicAt(a: P, b: P, c: P, d: P, t: number): P {
  const m = 1 - t;
  return [
    m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0],
    m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1],
  ];
}

type LeafOpts = { veins?: number; serrate?: boolean; widest?: number; midrib?: boolean };

/** A leaf from its stalk point. widest (0..1) moves the broadest part toward the tip. */
export function leaf(base: P, angle: number, len: number, w: number, opts: LeafOpts = {}): Stroke[] {
  const { veins = 3, serrate = false, widest = 0.4, midrib = true } = opts;
  const L = frame(base, angle);
  const h = w * 1.33;
  const c1u = len * (0.05 + widest * 0.4);
  const c2u = len * (0.45 + widest * 0.45);
  const out: Stroke[] = [];
  if (serrate) {
    const pts: P[] = [];
    for (const side of [1, -1]) {
      const a: P = [0, 0];
      const b: P = [c1u, h * side];
      const c: P = [c2u, h * side];
      const d: P = [len, 0];
      const seq: P[] = [];
      for (let i = 1; i < 14; i++) {
        const [u, v] = cubicAt(a, b, c, d, i / 14);
        const tooth = i % 2 === 0 ? 1 + 0.12 : 1 - 0.06;
        seq.push(L(u + (i % 2 === 0 ? len * 0.02 : 0), v * tooth));
      }
      pts.push(...(side === 1 ? seq : seq.reverse()));
      if (side === 1) pts.push(L(len, 0));
    }
    out.push({ d: poly([base, ...pts], true) });
  } else {
    out.push({
      d: `M${pt(base)}C${pt(L(c1u, h))} ${pt(L(c2u, h))} ${pt(L(len, 0))}C${pt(L(c2u, -h))} ${pt(L(c1u, -h))} ${pt(base)}Z`,
    });
  }
  if (midrib) out.push({ d: smooth([base, L(len * 0.5, w * 0.06), L(len * 0.9, 0)]), fine: true });
  for (let i = 1; i <= veins; i++) {
    const u = len * (0.12 + (0.7 * i) / (veins + 1));
    const reach = w * 0.72 * (1 - Math.abs(u / len - widest) * 0.9);
    for (const side of [1, -1]) {
      out.push({ d: smooth([L(u, 0), L(u + len * 0.08, side * reach * 0.6), L(u + len * 0.15, side * reach)]), fine: true });
    }
  }
  return out;
}

/** A petal with a rounded tip, plus engraved veins. */
export function petal(base: P, angle: number, len: number, w: number, veins = true): Stroke[] {
  const L = frame(base, angle);
  const out: Stroke[] = [
    {
      d: `M${pt(base)}C${pt(L(len * 0.3, w * 1.15))} ${pt(L(len * 1.05, w * 1.05))} ${pt(L(len, 0))}C${pt(L(len * 1.05, -w * 1.05))} ${pt(L(len * 0.3, -w * 1.15))} ${pt(base)}Z`,
    },
  ];
  if (veins) {
    out.push({ d: smooth([L(len * 0.1, 0), L(len * 0.75, 0)]), fine: true });
    out.push({ d: smooth([L(len * 0.15, 0), L(len * 0.5, w * 0.35), L(len * 0.75, w * 0.5)]), fine: true });
    out.push({ d: smooth([L(len * 0.15, 0), L(len * 0.5, -w * 0.35), L(len * 0.75, -w * 0.5)]), fine: true });
  }
  return out;
}

/** A broad petal with a crinkled rim, as on cistus or hibiscus. */
export function wavyPetal(base: P, angle: number, len: number, w: number): Stroke[] {
  const L = frame(base, angle);
  const pts: P[] = [base, L(len * 0.35, w * 0.65)];
  const k = 8;
  for (let i = 0; i <= k; i++) {
    const phi = 1 - (2 * i) / k;
    const crinkle = i % 2 === 0 ? len * 0.04 : -len * 0.03;
    pts.push(L(len * (1 - 0.28 * phi * phi) + crinkle, w * phi));
  }
  pts.push(L(len * 0.35, -w * 0.65));
  const out: Stroke[] = [{ d: smooth(pts, true) }];
  for (const v of [-0.45, 0, 0.45]) {
    out.push({ d: smooth([L(len * 0.12, 0), L(len * 0.5, w * v * 0.6), L(len * 0.82, w * v)]), fine: true });
  }
  return out;
}

/** n petals around a centre. */
export function flower(
  c: P,
  n: number,
  len: number,
  w: number,
  rotation = -90,
  kind: "round" | "pointed" | "wavy" = "round",
): Stroke[] {
  const out: Stroke[] = [];
  for (let i = 0; i < n; i++) {
    const a = rotation + (360 * i) / n;
    if (kind === "round") out.push(...petal(c, a, len, w));
    else if (kind === "wavy") out.push(...wavyPetal(c, a, len, w));
    else out.push(...leaf(c, a, len, w, { veins: 0, widest: 0.6 }));
  }
  return out;
}

/** A resin tear or drop, pointing along angle. */
export function tear(c: P, h: number, w: number, angle = -90): Stroke[] {
  const L = frame(c, angle);
  return [
    {
      d: `M${pt(L(h, 0))}C${pt(L(h * 0.3, w))} ${pt(L(-h * 0.5, w))} ${pt(L(-h * 0.5, 0))}C${pt(L(-h * 0.5, -w))} ${pt(L(h * 0.3, -w))} ${pt(L(h, 0))}Z`,
    },
    { d: smooth([L(h * 0.4, w * 0.35), L(-h * 0.1, w * 0.55), L(-h * 0.35, w * 0.3)]), fine: true },
  ];
}

/** A berry: outline, highlight and a crescent of shading. */
export function berry(c: P, r: number): Stroke[] {
  return [
    { d: circle(c, r) },
    { d: arc(c, r * 0.55, 200, 260), fine: true },
    { d: arc(c, r * 0.75, 10, 120), fine: true },
    { d: arc(c, r * 0.5, 30, 100), fine: true },
  ];
}

/** Compound leaf: a rachis with paired leaflets and one at the tip. */
export function pinnate(base: P, angle: number, len: number, pairs: number, ll: number, lw: number): Stroke[] {
  const L = frame(base, angle);
  const out: Stroke[] = [{ d: smooth([base, L(len * 0.5, lw * 0.3), L(len, 0)]) }];
  for (let i = 0; i < pairs; i++) {
    const u = len * (0.2 + (0.72 * i) / pairs);
    const p = L(u, 0);
    out.push(...leaf(p, angle - 55, ll, lw, { veins: 0 }));
    out.push(...leaf(p, angle + 55, ll, lw, { veins: 0 }));
  }
  out.push(...leaf(L(len, 0), angle, ll * 1.1, lw, { veins: 0 }));
  return out;
}

/** A tuft of needles radiating from a point. */
export function needles(c: P, angle: number, spread: number, n: number, len: number): Stroke[] {
  const out: Stroke[] = [];
  for (let i = 0; i < n; i++) {
    const a = angle - spread / 2 + (spread * i) / Math.max(1, n - 1);
    out.push({ d: line(c, polar(c, len * (0.85 + 0.15 * Math.sin(i * 1.7)), a)) });
  }
  return out;
}

/** Parallel hairlines between two curves, for engraved shading. */
export function hatchBetween(a: (t: number) => P, b: (t: number) => P, n: number): Stroke[] {
  const out: Stroke[] = [];
  for (let i = 1; i < n; i++) out.push({ d: line(a(i / n), b(i / n)), fine: true });
  return out;
}
