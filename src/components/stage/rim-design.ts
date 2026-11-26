// The outer band's reliefs: the house's own story in five cartouches, the
// four realms' botanicals and the founding still, between Kufic bands. One
// strip covers a quarter of the band and repeats round it.

import { type P, type Stroke, circle, line, poly, smooth, tear } from "@/components/flacon/kit";
import { botanical } from "@/components/flacon/botanicals";
import { star8 } from "@/components/astrolabe/geometry";
import { PLATE_R } from "@/lib/choreography";
import type { PlacedStroke } from "./plate-design";

export const RIM_H = 1.4;
/** An eighth of the band's circumference: the strip repeats eight times round it. */
export const STRIP_REPEAT = 8;
export const STRIP_W = (2 * Math.PI * PLATE_R) / STRIP_REPEAT;

/** The founding: the house's first still, drawn in a 100 unit box. */
export function foundingStill(): Stroke[] {
  return [
    // furnace with its fire-mouth
    { d: poly([[24, 96], [24, 72], [76, 72], [76, 96]], true) },
    { d: smooth([[40, 96], [40, 86], [50, 80], [60, 86], [60, 96]]) },
    ...tear([46, 92], 4, 2.4, -90),
    ...tear([53, 91], 5, 2.8, -90),
    { d: line([24, 78], [76, 78]), fine: true },
    // the cucurbit, sitting in the furnace
    { d: smooth([[36, 72], [31, 58], [36, 44], [45, 37], [55, 37], [64, 44], [69, 58], [64, 72]]) },
    { d: smooth([[38, 62], [45, 58], [55, 58], [62, 62]]), fine: true },
    // the alembic head and its swan neck running down to the receiver
    { d: smooth([[42, 37], [43, 27], [50, 22], [57, 27], [58, 37]]) },
    { d: smooth([[57, 27], [70, 27], [82, 34], [88, 46]]) },
    { d: smooth([[58, 31], [70, 31], [80, 37], [85, 47]]) },
    // the receiver and the first drop of oil
    { d: circle([88, 63], 9) },
    { d: line([85, 54], [85, 47]) },
    { d: line([91, 54], [91, 48]) },
    ...tear([88, 52], 2.4, 1.4, 90),
    // a sprig of the first harvest
    { d: smooth([[12, 96], [14, 80], [18, 66]]) },
    { d: smooth([[14, 84], [8, 78], [7, 72]]), fine: true },
    { d: smooth([[16, 74], [22, 70], [24, 64]]), fine: true },
  ];
}

/** A pointed horseshoe cartouche, as on the flacons. */
function cartouche(cx: number, cy: number, w: number, h: number): Stroke[] {
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const d = `M${x0} ${bottom}L${x0} ${cy - h * 0.05}C${x0 - w * 0.06} ${top + h * 0.1} ${cx - w * 0.2} ${top} ${cx} ${top - h * 0.05}C${cx + w * 0.2} ${top} ${x1 + w * 0.06} ${top + h * 0.1} ${x1} ${cy - h * 0.05}L${x1} ${bottom}Z`;
  return [{ d }];
}

/** Kufic-style ascenders along a straight band, abstract rather than legible. */
function linearKufic(x0: number, x1: number, base: number, top: number, unit: number): Stroke[] {
  const out: Stroke[] = [{ d: line([x0, base], [x1, base]) }];
  const h = base - top;
  for (let x = x0 + unit * 0.3, i = 0; x < x1 - unit * 0.3; x += unit, i++) {
    const k = (i * 5 + 2) % 4;
    if (k === 0 || k === 2) {
      out.push({ d: line([x, base], [x, top + h * 0.15]) });
      out.push({ d: `M${x} ${top + h * 0.15}Q${x - unit * 0.2} ${top} ${x - unit * 0.24} ${top + h * 0.25}` });
      out.push({ d: `M${x} ${top + h * 0.15}Q${x + unit * 0.2} ${top} ${x + unit * 0.24} ${top + h * 0.25}` });
    } else if (k === 1) {
      out.push({ d: poly([[x + unit * 0.1, base], [x + unit * 0.1, base - h * 0.45], [x + unit * 0.5, base - h * 0.45], [x + unit * 0.5, base]]) });
    } else {
      out.push({ d: poly([[x, base], [x, base - h * 0.3], [x + unit * 0.4, base - h * 0.3], [x + unit * 0.4, base - h * 0.7]]) });
    }
  }
  return out;
}

const STORY = ["boswellia", "rose", "founding", "saffron-crocus", "sandalwood"];

/** The strip in band units: x along the band, y down from its top edge. */
export function rimStrip(): PlacedStroke[] {
  const W = STRIP_W;
  const s: PlacedStroke[] = [];
  for (const y of [0.06, 0.32, 1.12, 1.34]) s.push({ d: line([0, y], [W, y]) });
  s.push(...linearKufic(0, W, 0.29, 0.1, 0.13));
  s.push(...linearKufic(0, W, 1.31, 1.15, 0.13));
  const n = STORY.length;
  STORY.forEach((key, i) => {
    const cx = (W * (i + 0.5)) / n;
    const cy = 0.73;
    s.push(...cartouche(cx, cy, 1.12, 0.66));
    const size = 0.64;
    const drawing = key === "founding" ? foundingStill() : botanical(key);
    const k = size / 100;
    s.push(...drawing.map((st) => ({ ...st, tf: [cx - 50 * k, cy - 50 * k + 0.02, k] as [number, number, number] })));
    // rosettes between the cartouches
    const rx = (W * (i + 1)) / n;
    s.push({ d: star8([rx, 0.72] as P, 0.09) }, { d: circle([rx, 0.72], 0.035), fine: true });
  });
  return s;
}
