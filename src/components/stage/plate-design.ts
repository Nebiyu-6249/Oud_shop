// What is engraved on the stage's plate and where its windows are cut. In
// drawing units: x is world x, y is world z (so the throne side, -z, is up).

import { type P, type Stroke, arc, circle, line, polar, smooth } from "@/components/flacon/kit";
import { botanical } from "@/components/flacon/botanicals";
import { kuficBand, star8 } from "@/components/astrolabe/geometry";
import { PLATE_R, STATIONS, type StationId } from "@/lib/choreography";

/** Plate angles run from +x toward +z, which in drawing units is y down: the same sense. */
const at = (a: number, r: number): P => polar([0, 0], r, a);

/** The engraved botanical at each station's medallion. */
export const STATION_BOTANICAL: Record<StationId, string> = {
  resins: "boswellia",
  florals: "rose",
  ember: "saffron-crocus",
  woods: "sandalwood",
};

/** Windows cut through the plate, through which the gears are glimpsed. */
export type PlateWindow = { id: string; angle: number; r0: number; r1: number; sweep: number };

export const WINDOWS: PlateWindow[] = [
  { id: "descent", angle: 236, r0: 3.7, r1: 4.8, sweep: 22 },
  ...(Object.keys(STATIONS) as StationId[]).map((id) => ({
    id,
    angle: STATIONS[id].angle + 22,
    r0: 6.3,
    r1: 7.1,
    sweep: 16,
  })),
];

/** A window as a closed outline: an arc slot with rounded ends. */
export function windowOutline(w: PlateWindow, steps = 18): P[] {
  const a0 = w.angle - w.sweep / 2;
  const a1 = w.angle + w.sweep / 2;
  const pts: P[] = [];
  for (let i = 0; i <= steps; i++) pts.push(at(a0 + ((a1 - a0) * i) / steps, w.r1));
  const rm = (w.r0 + w.r1) / 2;
  const rr = (w.r1 - w.r0) / 2;
  const capEnd = at(a1, rm);
  for (let i = 1; i < 8; i++) pts.push(polar(capEnd, rr, a1 + (180 * i) / 8));
  for (let i = steps; i >= 0; i--) pts.push(at(a0 + ((a1 - a0) * i) / steps, w.r0));
  const capStart = at(a0, rm);
  for (let i = 1; i < 8; i++) pts.push(polar(capStart, rr, a0 + 180 + (180 * i) / 8));
  return pts;
}

/** A stroke drawn at a translation and scale (applied when painting). */
export type PlacedStroke = Stroke & { tf?: [number, number, number] };

function scaledBotanical(key: string, c: P, size: number): PlacedStroke[] {
  // botanicals are drawn in a 100 unit box centred on (50, 50)
  const s = size / 100;
  return botanical(key).map((st) => ({ ...st, tf: [c[0] - 50 * s, c[1] - 50 * s, s] }));
}

export function plateEngraving(): PlacedStroke[] {
  const R = PLATE_R;
  const s: PlacedStroke[] = [];
  // the limb: rings and a degree scale
  for (const r of [R - 0.15, R - 0.45, R - 1.05]) s.push({ d: circle([0, 0], r) });
  for (let a = 0; a < 360; a += 2) {
    const long = a % 10 === 0;
    s.push({ d: line(at(a, R - 1.05), at(a, long ? R - 0.45 : R - 0.8)), fine: !long });
  }
  // a Kufic band within the scale
  s.push(...kuficBand(R - 2.05, R - 1.3, 0, 359, 3.2));
  s.push({ d: circle([0, 0], R - 2.15) });
  // almucantars: eccentric circles climbing toward the zenith, as on a real plate
  for (let k = 0; k < 7; k++) s.push({ d: circle([0, -k * 0.42], 7.4 - k * 0.95), fine: k % 2 === 1 });
  const zenith: P = [0, -3.1];
  for (const a of [-70, -45, -20, 20, 45, 70, 110, 135, 160, 200, 225, 250]) {
    const far = at(a + 90, 7.3);
    s.push({ d: smooth([zenith, [(zenith[0] + far[0]) / 2 + far[1] * 0.08, (zenith[1] + far[1]) / 2], far]), fine: true });
  }
  s.push({ d: arc([0, -8.8], 11.2, 58, 122) });
  // a medallion and its botanical at each station
  for (const id of Object.keys(STATIONS) as StationId[]) {
    const c = at(STATIONS[id].angle, STATIONS[id].r);
    s.push({ d: circle(c, 1.75) }, { d: circle(c, 1.6), fine: true });
    for (let i = 0; i < 16; i++) s.push({ d: star8(polar(c, 1.68, i * 22.5), 0.05), fine: true });
    s.push(...scaledBotanical(STATION_BOTANICAL[id], c, 2.6));
  }
  // engraved borders round the windows
  for (const w of WINDOWS) {
    const o = windowOutline(w).map(([x, y]) => [x, y] as P);
    s.push({ d: smooth([...o, o[0]]) });
  }
  return s;
}
