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
/** Portrait screens see little width through 25 degrees; a slightly wider lens still reads as a model. */
export const FOV_COMPACT = 34;

const deg = (d: number) => (d * Math.PI) / 180;
/** A point at `r` from the pivot, `a` degrees from +x toward +z, at height y. */
export const polarY = (a: number, r: number, y: number) => new Vector3(r * Math.cos(deg(a)), y, r * Math.sin(deg(a)));

export type StationId = "resins" | "florals" | "ember" | "woods";

/** Where each realm's mechanism rises from the plate. */
export const STATIONS: Record<StationId, { angle: number; r: number; camAngle: number; camY: number; lookY: number; dist: number }> = {
  resins: { angle: 210, r: 5, camAngle: 20, camY: 1.45, lookY: 0.95, dist: 5 },
  florals: { angle: 290, r: 5, camAngle: 120, camY: 1.9, lookY: 0.45, dist: 5.2 },
  ember: { angle: 115, r: 5, camAngle: -65, camY: 1.3, lookY: 0.55, dist: 4.4 },
  woods: { angle: 30, r: 5.2, camAngle: 200, camY: 1.25, lookY: 0.45, dist: 4.6 },
};

export const stationCenter = (id: StationId) => polarY(STATIONS[id].angle, STATIONS[id].r, 0);

/**
 * Two camera paths. "full" for landscape screens. "compact" for phones and
 * tall screens: a shorter spline without the optional glide points, framed
 * through a slightly wider lens (FOV_COMPACT) from a little further back,
 * since a 25 degree lens on a portrait screen sees far less width.
 */
export type CameraVariant = "full" | "compact";

/** The composed frame at a station: standing off a few units, lens a little above the work. */
function stationShot(id: StationId, variant: CameraVariant) {
  const st = STATIONS[id];
  const c = stationCenter(id);
  const far = variant === "compact" ? 1.25 : 1;
  const off = polarY(st.camAngle, st.dist * far, st.camY * (variant === "compact" ? 1.15 : 1));
  return { cam: c.clone().add(off), look: c.clone().add(new Vector3(0, st.lookY, 0)) };
}

/** `optional` keys only shape the full path; the compact one goes straight. */
type Key = { label?: BeatLabel; cam: Vector3; look: Vector3; optional?: boolean };

function keys(variant: CameraVariant): Key[] {
  const resins = stationShot("resins", variant);
  const florals = stationShot("florals", variant);
  const ember = stationShot("ember", variant);
  const woods = stationShot("woods", variant);
  const swingAt = new Vector3(-0.35, variant === "compact" ? 1.55 : 1.35, -0.25);
  const rimR = variant === "compact" ? 7.2 : 7.75;
  const all: Key[] = [
    // Rim: tight on the engraved outer band, tracking along it
    { label: "rim", cam: polarY(158, rimR, 0.8), look: polarY(176, 10, 0.62) },
    { cam: polarY(186, rimR, 0.95), look: polarY(204, 10, 0.7) },
    // Descent: up over the rete, tilting down through its openings
    { cam: polarY(204, 7.4, 3.8), look: polarY(212, 3.2, 0) },
    { label: "descent", cam: polarY(222, 2.4, 0.95), look: polarY(236, 4.4, -0.35) },
    // Resins
    { cam: polarY(250, 1.6, 0.8), look: polarY(212, 4.2, 0.4), optional: true },
    { label: "resins", ...resins },
    // glide low across the engraving to Florals
    { cam: new Vector3(0.6, 0.7, -2.0), look: polarY(270, 5.2, 0.3), optional: true },
    { label: "florals", ...florals },
    // the swing: one deliberate half turn on the spot, then reorient
    { cam: swingAt, look: swingAt.clone().add(polarY(300, 6, -0.6)) },
    { cam: swingAt.clone().add(new Vector3(0.1, 0.15, 0.1)), look: swingAt.clone().add(polarY(30, 6, -0.6)) },
    { cam: swingAt.clone().add(new Vector3(0.15, 0.1, 0.35)), look: swingAt.clone().add(polarY(120, 6, -0.6)) },
    { label: "ember", ...ember },
    { cam: new Vector3(-1.2, 0.75, 1.9), look: polarY(60, 4.5, 0.3), optional: true },
    { label: "woods", ...woods },
    // Ascent: rise until the whole instrument fills the frame, throne at the top
    { cam: new Vector3(0.6, 9, 3.5), look: new Vector3(0, 0, 0.6) },
    // a portrait frame needs more height to hold the whole disc across its width
    { label: "ascent", cam: new Vector3(0, variant === "compact" ? 78 : 52, 0.8), look: new Vector3(0, 0, 0) },
  ];
  return variant === "compact" ? all.filter((k) => !k.optional) : all;
}

function buildPath(variant: CameraVariant) {
  const k = keys(variant);
  const cam = new CatmullRomCurve3(k.map((x) => x.cam), false, "centripetal");
  const look = new CatmullRomCurve3(k.map((x) => x.look), false, "centripetal");
  const labels = BEATS.map((b) => ({ at: b.at, t: k.findIndex((x) => x.label === b.label) / (k.length - 1) }));
  return { cam, look, labels };
}

const PATHS: Record<CameraVariant, ReturnType<typeof buildPath>> = { full: buildPath("full"), compact: buildPath("compact") };

/** Each composed frame holds for this much progress before the camera moves on. */
export const HOLD = 0.03;

/**
 * Spline parameter for a progress value. Between two labels the camera eases
 * in and out (long, smooth) after a short hold on the first label's frame.
 */
export function cameraT(p: number, variant: CameraVariant = "full"): number {
  const L = PATHS[variant].labels;
  for (let i = 0; i < L.length - 1; i++) {
    const a = L[i];
    const b = L[i + 1];
    if (p <= b.at || i === L.length - 2) {
      const s = smoother(span(p, a.at + HOLD, b.at));
      return a.t + (b.t - a.t) * s;
    }
  }
  return 1;
}

export function cameraAt(p: number, out = { pos: new Vector3(), look: new Vector3() }, variant: CameraVariant = "full") {
  const t = cameraT(p, variant);
  PATHS[variant].cam.getPoint(t, out.pos);
  PATHS[variant].look.getPoint(t, out.look);
  return out;
}

/**
 * Camera travel from the Rim to a label, sampled. The two paths are compared
 * up to Woods: in the Ascent a portrait screen must climb further to fit the
 * whole disc across its width, which is framing, not path.
 */
export function pathLength(variant: CameraVariant, upTo: BeatLabel = "woods"): number {
  const t1 = PATHS[variant].labels.find((l) => l.at === BEATS.find((b) => b.label === upTo)!.at)!.t;
  let len = 0;
  let prev = PATHS[variant].cam.getPoint(0);
  for (let i = 1; i <= 2000; i++) {
    const cur = PATHS[variant].cam.getPoint((t1 * i) / 2000);
    len += cur.distanceTo(prev);
    prev = cur;
  }
  return len;
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

/**
 * The rete's turn on its pivot, as a plate (drawing) angle: clockwise seen
 * from above. During the sequence it rests a little turned; in the Ascent it
 * settles where the finder's instrument idles, Amber under the index.
 */
export const RETE_FINDER = deg(-90);
export function reteAngle(p: number): number {
  const settle = smoother(span(p, 0.86, 0.98));
  return deg(38) * (1 - settle) + RETE_FINDER * settle;
}

/** The engraved outer band turns slowly under the camera during the Rim. */
export const rimAngle = (p: number) => deg(-24) * smoother(span(p, 0, 0.16));

/** The rule rests clear of the camera's descent, then swings to the finder's idle angle. */
export const RULE_FINDER = deg(35);
export const ruleAngle = (p: number) => deg(120) + (RULE_FINDER - deg(120)) * smoother(span(p, 0.88, 0.99));
