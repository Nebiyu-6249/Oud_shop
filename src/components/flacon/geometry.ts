// Builds an engraved flacon from FlaconParams. Pure: the same params always
// give the same drawing, so it renders on the server with no client code.

import type { FlaconParams } from "@/lib/flacon";
import { type P, type Stroke, circle, curveSegments, leaf, line, poly, pt, r2, smooth } from "./kit";

export const VIEW_W = 200;
export const VIEW_H = 320;
const CX = VIEW_W / 2;
const BASE = 296;

export type FlaconDrawing = {
  /** Closed outline of the glass, also the clip for hatching. */
  body: string;
  /** Strokes clipped to the body: shading, liquid, band pattern. */
  inside: Stroke[];
  /** Unclipped strokes: inner wall, neck ring, stopper, ground shadow. */
  outside: Stroke[];
  /** Label cartouche and where the botanical goes inside it. */
  cartouche: { d: string; x: number; y: number; size: number };
};

type Profile = { pts: P[]; H: number; maxHW: number; neckTop: number; neckHW: number; liquid: number | null; bandY: number; labelY: number };

/** Right-hand profile from the base up to the lip, as (halfWidth, y) points. */
function profile(p: FlaconParams): Profile {
  const H = p.silhouette === "jar" ? 120 : p.silhouette === "vial" ? 150 : 175;
  const W = Math.min(176, p.aspect * H);
  const hw = W / 2;
  const nhw = Math.max(7, W * 0.13);
  const neckH = p.neck * H;
  const sh = p.shoulder;
  const y = (f: number) => BASE - f * H;
  let pts: [number, number][];
  let liquid: number | null = y(0.8);
  let bandY = y(0.3);
  let labelY = y(0.58);

  switch (p.silhouette) {
    case "flask":
      pts = [
        [hw * 0.94, BASE],
        [hw, y(0.05)],
        [hw, y(0.72 - sh * 0.18)],
        [hw * (0.55 + 0.4 * (1 - sh)), y(0.97 - sh * 0.04)],
        [nhw, y(1)],
      ];
      break;
    case "ewer":
      pts = [
        [hw * 0.5, BASE],
        [hw * 0.42, y(0.05)],
        [hw * 0.82, y(0.16)],
        [hw, y(0.38)],
        [hw * 0.78, y(0.64)],
        [nhw * (1.3 + sh), y(0.88)],
        [nhw, y(1)],
      ];
      liquid = y(0.7);
      bandY = y(0.12);
      labelY = y(0.4);
      break;
    case "column":
      pts = [
        [hw * 1.08, BASE],
        [hw * 1.08, y(0.04)],
        [hw, y(0.06)],
        [hw, y(0.86 - sh * 0.1)],
        [hw * (0.3 + 0.6 * (1 - sh)), y(0.98)],
        [nhw, y(1)],
      ];
      break;
    case "vial":
      pts = [
        [hw * 0.18, BASE],
        [hw * 0.72, y(0.1)],
        [hw, y(0.34)],
        [hw * (0.7 + 0.1 * sh), y(0.62)],
        [nhw * 1.25, y(0.9)],
        [nhw, y(1)],
      ];
      liquid = y(0.7);
      bandY = y(0.15);
      labelY = y(0.4);
      break;
    case "jar":
      pts = [
        [hw * 0.92, BASE],
        [hw, y(0.06)],
        [hw, y(0.84)],
        [hw * (1 - 0.06 * sh), y(0.96)],
        [hw * 0.9, y(1)],
      ];
      liquid = null;
      bandY = y(0.88);
      labelY = y(0.5);
      break;
  }
  const last = pts[pts.length - 1];
  const neckTop = BASE - H - neckH;
  if (neckH > 0) pts.push([last[0], neckTop]);
  return {
    pts: pts.map(([x, yy]) => [CX + x, yy] as P),
    H,
    maxHW: Math.max(...pts.map(([x]) => x)),
    neckTop,
    neckHW: last[0],
    liquid,
    bandY,
    labelY,
  };
}

const mirror = (ps: P[]): P[] => ps.map(([x, y]) => [2 * CX - x, y] as P).reverse();

function outline(pts: P[], scale = 1): string {
  const s = pts.map(([x, y]) => [CX + (x - CX) * scale, y] as P);
  const left = mirror(s);
  const topL = left[0];
  return `M${pt(left[left.length - 1])}L${pt(s[0])}${curveSegments(s)}L${pt(topL)}${curveSegments(left)}Z`;
}

/** Vertical hairlines spaced like a turned cylinder: dense at the edges. */
function cylinderShading(prof: Profile): Stroke[] {
  const out: Stroke[] = [];
  const top = BASE - prof.H;
  const n = 34;
  for (let k = 1; k < n; k++) {
    const t = -Math.PI / 2 + (Math.PI * k) / n;
    const s = Math.sin(t);
    // light comes from the upper left: shade the right flank and the far left rim
    if (s > 0.2 || s < -0.82) {
      const x = CX + prof.maxHW * s;
      out.push({ d: line([x, BASE], [x, top]), fine: true });
    }
  }
  return out;
}

function band(p: FlaconParams, prof: Profile): Stroke[] {
  if (p.engraving === "none") return [];
  const h = prof.H * 0.1;
  const y0 = prof.bandY - h / 2;
  const y1 = prof.bandY + h / 2;
  const x0 = CX - prof.maxHW - 4;
  const x1 = CX + prof.maxHW + 4;
  const out: Stroke[] = [{ d: line([x0, y0], [x1, y0]) }, { d: line([x0, y1], [x1, y1]) }];
  const s = h * 0.7;
  const pad = (h - s) / 2;
  const count = Math.ceil((x1 - x0) / h);

  for (let i = 0; i < count; i++) {
    const ux = x0 + i * h + pad;
    const uy = y0 + pad;
    if (p.engraving === "kufic-band") {
      // An abstract Kufic band, not legible text: a baseline carrying tall
      // ascenders with split, foliate tips and low square letter bodies.
      const base = y1 - pad;
      const top = y0 + pad * 0.5;
      const kind = (i * 7 + 3) % 4;
      out.push({ d: line([ux - pad, base], [ux + s + pad, base]) });
      if (kind === 0 || kind === 2) {
        const x = ux + s * 0.25;
        out.push({ d: line([x, base], [x, top + s * 0.15]) });
        out.push({ d: `M${pt([x, top + s * 0.15])}Q${pt([x - s * 0.22, top])} ${pt([x - s * 0.18, top + s * 0.22])}` });
        out.push({ d: `M${pt([x, top + s * 0.15])}Q${pt([x + s * 0.22, top])} ${pt([x + s * 0.18, top + s * 0.22])}` });
        out.push({ d: poly([[ux + s * 0.5, base], [ux + s * 0.5, base - s * 0.42], [ux + s * 0.95, base - s * 0.42], [ux + s * 0.95, base]]) });
      } else if (kind === 1) {
        out.push({ d: poly([[ux + s * 0.1, base - s * 0.5], [ux + s * 0.1, base - s * 0.25], [ux + s * 0.8, base - s * 0.25], [ux + s * 0.8, top + s * 0.1]]) });
        out.push({ d: circle([ux + s * 0.8, top + s * 0.02], s * 0.08), fine: true });
      } else {
        out.push({ d: poly([[ux + s * 0.15, base], [ux + s * 0.15, base - s * 0.55], [ux + s * 0.6, base - s * 0.55], [ux + s * 0.6, base - s * 0.25], [ux + s * 0.38, base - s * 0.25]]) });
        out.push({ d: line([ux + s * 0.85, base], [ux + s * 0.85, top + s * 0.25]) });
      }
    } else if (p.engraving === "lattice") {
      const c: P = [ux + s / 2, uy + s / 2];
      const r = s / 2;
      const sq = (o: number) =>
        poly([0, 1, 2, 3].map((j) => {
          const a = ((o + j * 90) * Math.PI) / 180;
          return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as P;
        }), true);
      out.push({ d: sq(0) }, { d: sq(45) }, { d: circle(c, r * 0.3), fine: true });
    } else if (p.engraving === "vine") {
      const a: P = [x0 + i * h, prof.bandY];
      const m: P = [x0 + (i + 0.5) * h, prof.bandY + (i % 2 ? 1 : -1) * h * 0.25];
      const b: P = [x0 + (i + 1) * h, prof.bandY];
      out.push({ d: smooth([a, m, b]) });
      out.push(...leaf(m, i % 2 ? -60 : 60, h * 0.38, h * 0.12, { veins: 0 }));
    }
  }
  return out;
}

function stopper(p: FlaconParams, prof: Profile): Stroke[] {
  const y = prof.neckTop;
  const nw = prof.neckHW;
  const out: Stroke[] = [];
  // lip ring
  out.push({ d: poly([[CX - nw * 1.25, y], [CX - nw * 1.25, y - 4], [CX + nw * 1.25, y - 4], [CX + nw * 1.25, y]], true) });
  const top = y - 4;

  switch (p.stopper) {
    case "dome": {
      const w = nw * 1.5;
      out.push({ d: `M${pt([CX - w, top])}C${pt([CX - w, top - w * 1.5])} ${pt([CX + w, top - w * 1.5])} ${pt([CX + w, top])}Z` });
      out.push({ d: smooth([[CX - w * 0.55, top - w * 0.2], [CX - w * 0.4, top - w * 0.75], [CX, top - w * 1.05]]), fine: true });
      break;
    }
    case "finial": {
      const r = nw * 1.05;
      const cy = top - r;
      out.push({ d: circle([CX, cy], r) });
      out.push({ d: smooth([[CX - r * 0.6, cy - r * 0.8], [CX - r * 0.5, cy - r * 1.4], [CX, cy - r * 2.6]]) });
      out.push({ d: smooth([[CX + r * 0.6, cy - r * 0.8], [CX + r * 0.5, cy - r * 1.4], [CX, cy - r * 2.6]]) });
      out.push({ d: circle([CX, cy - r * 2.75], r * 0.15) });
      out.push({ d: smooth([[CX + r * 0.2, cy - r * 0.6], [CX + r * 0.7, cy], [CX + r * 0.2, cy + r * 0.6]]), fine: true });
      break;
    }
    case "faceted": {
      const w = nw * 1.7;
      const h = w * 1.5;
      const pts: P[] = [
        [CX - w * 0.7, top],
        [CX - w, top - h * 0.45],
        [CX - w * 0.5, top - h],
        [CX + w * 0.5, top - h],
        [CX + w, top - h * 0.45],
        [CX + w * 0.7, top],
      ];
      out.push({ d: poly(pts, true) });
      const mid: P = [CX, top - h * 0.5];
      for (const q of pts) out.push({ d: line(mid, q), fine: true });
      out.push({ d: line([CX - w, top - h * 0.45], [CX + w, top - h * 0.45]), fine: true });
      break;
    }
    case "rod": {
      // a slim cap over the glass dauber that runs down into the oil
      const w = nw * 1.1;
      out.push({ d: poly([[CX - w, top], [CX - w * 0.8, top - w * 3.2], [CX + w * 0.8, top - w * 3.2], [CX + w, top]], true) });
      out.push({ d: circle([CX, top - w * 3.2 - w * 0.55], w * 0.55) });
      out.push({ d: line([CX, y], [CX, prof.liquid ?? BASE - prof.H * 0.5]), fine: true });
      for (let i = 1; i < 4; i++) out.push({ d: line([CX - w * 0.9, top - i * w * 0.8], [CX + w * 0.9, top - i * w * 0.8]), fine: true });
      break;
    }
    case "lid": {
      const w = nw * 1.08;
      const h = 12;
      out.push({ d: poly([[CX - w, top], [CX - w, top - h], [CX + w, top - h], [CX + w, top]], true) });
      out.push({ d: line([CX - w, top - h * 0.5], [CX + w, top - h * 0.5]), fine: true });
      out.push({ d: `M${pt([CX - 9, top - h])}C${pt([CX - 9, top - h - 12])} ${pt([CX + 9, top - h - 12])} ${pt([CX + 9, top - h])}` });
      out.push({ d: circle([CX, top - h - 11], 2) });
      break;
    }
  }
  return out;
}

/** A pointed horseshoe-arch cartouche holding the botanical. */
function cartouche(prof: Profile) {
  const size = Math.min(prof.maxHW * 1.15, prof.H * 0.42);
  const x = CX;
  const y = prof.labelY;
  const w = size / 2;
  const top = y - size * 0.62;
  const d =
    `M${pt([x - w, y + size * 0.5])}L${pt([x - w, y - size * 0.1])}` +
    `C${pt([x - w * 1.12, top + size * 0.12])} ${pt([x - w * 0.35, top])} ${pt([x, top - size * 0.08])}` +
    `C${pt([x + w * 0.35, top])} ${pt([x + w * 1.12, top + size * 0.12])} ${pt([x + w, y - size * 0.1])}` +
    `L${pt([x + w, y + size * 0.5])}Z`;
  return { d, x, y: y - size * 0.08, size: size * 0.82 };
}

export function buildFlacon(p: FlaconParams): FlaconDrawing {
  const prof = profile(p);
  const body = outline(prof.pts);
  const inside: Stroke[] = [...cylinderShading(prof)];

  if (prof.liquid !== null) {
    const lx = prof.maxHW + 2;
    inside.push({ d: `M${pt([CX - lx, prof.liquid])}Q${pt([CX, prof.liquid + 4])} ${pt([CX + lx, prof.liquid])}` });
    for (let y = prof.liquid + 7; y < BASE; y += 7) {
      inside.push({ d: line([CX - lx, y], [CX + lx, y]), fine: true });
    }
  } else {
    // bakhoor: a heap of resin-soaked chips seen through the jar
    for (let i = 0; i < 9; i++) {
      const cx = CX - prof.maxHW * 0.7 + (i % 5) * prof.maxHW * 0.35;
      const cy = BASE - 10 - Math.floor(i / 5) * 12;
      inside.push({ d: poly([[cx - 8, cy + 3], [cx - 3, cy - 5], [cx + 7, cy - 3], [cx + 9, cy + 4]], true) });
    }
  }
  inside.push(...band(p, prof));

  const outside: Stroke[] = [
    { d: outline(prof.pts, 0.92), fine: true },
    ...stopper(p, prof),
  ];
  // shadow on the ground, struck in a few strokes
  for (const [i, f] of [1, 0.75, 0.5].entries()) {
    const w = prof.maxHW * 1.25 * f;
    outside.push({ d: line([CX - w * 0.6, BASE + 4 + i * 4], [CX + w, BASE + 4 + i * 4]), fine: i > 0 });
  }

  return { body, inside, outside, cartouche: cartouche(prof) };
}

export const viewBox = `0 ${r2(0)} ${VIEW_W} ${VIEW_H}`;
