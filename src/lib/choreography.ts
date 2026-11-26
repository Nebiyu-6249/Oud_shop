// Where everything is at a given progress. Pure functions of p in [0, 1]:
// no clocks, no state, so the same scroll position always gives the same
// frame, forwards or backwards.
//
// World: the astrolabe's plate is a disc of radius 10 at y = 0, y up. The
// throne (kursi) points to -z, so a camera looking straight down with -z at
// the top of the screen sees the instrument as the finder draws it.

import { CatmullRomCurve3, Vector3 } from "three";
import { type BeatLabel, BEATS, labelAt, smoother, span } from "./sequence";

export const PLATE_R = 10;
export const FOV = 25;

const deg = (d: number) => (d * Math.PI) / 180;
/** A point at `r` from the pivot, `a` degrees from +x toward +z, at height y. */
export const polarY = (a: number, r: number, y: number) => new Vector3(r * Math.cos(deg(a)), y, r * Math.sin(deg(a)));

export type StationId = "resins" | "florals" | "ember" | "woods";

/** Where each realm's mechanism rises from the plate. */
export const STATIONS: Record<StationId, { angle: number; r: number; camAngle: number }> = {
  resins: { angle: 210, r: 5, camAngle: 20 },
  florals: { angle: 290, r: 5, camAngle: 120 },
  ember: { angle: 115, r: 5, camAngle: -65 },
  woods: { angle: 30, r: 5.2, camAngle: 200 },
};

export const stationCenter = (id: StationId) => polarY(STATIONS[id].angle, STATIONS[id].r, 0);

/** The composed frame at a station: standing off 4.6 units, lens a little above the work. */
function stationShot(id: StationId) {
  const c = stationCenter(id);
  const off = polarY(STATIONS[id].camAngle, 4.6, 1.25);
  return { cam: c.clone().add(off), look: c.clone().add(new Vector3(0, 0.7, 0)) };
}

type Key = { label?: BeatLabel; cam: Vector3; look: Vector3 };

function keys(): Key[] {
  const resins = stationShot("resins");
  const florals = stationShot("florals");
  const ember = stationShot("ember");
  const woods = stationShot("woods");
  const swingAt = new Vector3(-0.35, 1.35, -0.25);
  return [
    // Rim: tight on the engraved outer band, tracking along it
    { label: "rim", cam: polarY(160, 8.35, 0.85), look: polarY(176, 10, 0.72) },
    { cam: polarY(188, 8.35, 0.95), look: polarY(204, 10, 0.78) },
    // Descent: up over the rete, tilting down through its openings
    { cam: polarY(204, 7.4, 3.8), look: polarY(212, 3.2, 0) },
    { label: "descent", cam: polarY(222, 2.4, 0.95), look: polarY(236, 4.4, -0.35) },
    // Resins
    { cam: polarY(250, 1.6, 0.8), look: polarY(212, 4.2, 0.4) },
    { label: "resins", ...resins },
    // glide low across the engraving to Florals
    { cam: new Vector3(0.6, 0.7, -2.0), look: polarY(270, 5.2, 0.3) },
    { label: "florals", ...florals },
    // the swing: one deliberate half turn on the spot, then reorient
    { cam: swingAt, look: swingAt.clone().add(polarY(300, 6, -0.6)) },
    { cam: swingAt.clone().add(new Vector3(0.1, 0.15, 0.1)), look: swingAt.clone().add(polarY(30, 6, -0.6)) },
    { cam: swingAt.clone().add(new Vector3(0.15, 0.1, 0.35)), look: swingAt.clone().add(polarY(120, 6, -0.6)) },
    { label: "ember", ...ember },
    { cam: new Vector3(-1.2, 0.75, 1.9), look: polarY(60, 4.5, 0.3) },
    { label: "woods", ...woods },
    // Ascent: rise until the whole instrument fills the frame, throne at the top
    { cam: new Vector3(0.6, 9, 3.5), look: new Vector3(0, 0, 0.6) },
    { label: "ascent", cam: new Vector3(0, 52, 0.8), look: new Vector3(0, 0, 0) },
  ];
}

const KEYS = keys();
const camCurve = new CatmullRomCurve3(KEYS.map((k) => k.cam), false, "centripetal");
const lookCurve = new CatmullRomCurve3(KEYS.map((k) => k.look), false, "centripetal");
const keyT = (i: number) => i / (KEYS.length - 1);
const LABEL_KEYS = BEATS.map((b) => ({ at: b.at, t: keyT(KEYS.findIndex((k) => k.label === b.label)) }));

/** Each composed frame holds for this much progress before the camera moves on. */
export const HOLD = 0.03;

/**
 * Spline parameter for a progress value. Between two labels the camera eases
 * in and out (long, smooth) after a short hold on the first label's frame.
 */
export function cameraT(p: number): number {
  for (let i = 0; i < LABEL_KEYS.length - 1; i++) {
    const a = LABEL_KEYS[i];
    const b = LABEL_KEYS[i + 1];
    if (p <= b.at || i === LABEL_KEYS.length - 2) {
      const s = smoother(span(p, a.at + HOLD, b.at));
      return a.t + (b.t - a.t) * s;
    }
  }
  return 1;
}

export function cameraAt(p: number, out = { pos: new Vector3(), look: new Vector3() }) {
  const t = cameraT(p);
  camCurve.getPoint(t, out.pos);
  lookCurve.getPoint(t, out.look);
  return out;
}

/** The camera's frame at a label, exactly. */
export function cameraAtLabel(label: BeatLabel) {
  return cameraAt(labelAt(label));
}

// ------------------------------------------------------------ mechanisms

/** How far before its label a structure starts rising; it finishes as the camera settles. */
const LEAD = 0.1;

/** Ascent folds the structures flat in reverse order: woods first, resins last. */
const FOLD: Record<StationId, [number, number]> = {
  woods: [0.83, 0.88],
  ember: [0.85, 0.9],
  florals: [0.87, 0.92],
  resins: [0.89, 0.94],
};

/** 0 flat in the plate, 1 fully risen. Rises into its label, folds during Ascent. */
export function structureState(id: StationId, p: number): number {
  const at = labelAt(id);
  const rise = span(p, at - LEAD, at - 0.004);
  const fold = span(p, FOLD[id][0], FOLD[id][1]);
  return rise * (1 - fold);
}

/** The master drive shaft: turns steadily with progress, 14 turns over the sequence. */
export const driveAngle = (p: number) => p * Math.PI * 2 * 14;

/** The rete's slow turn on its pivot during the sequence, settling at zero for the finder. */
export function reteAngle(p: number): number {
  return deg(38) * (1 - smoother(span(p, 0.86, 0.98)));
}
