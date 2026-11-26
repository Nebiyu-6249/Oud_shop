// Each realm's mechanism is built in its own station frame: origin at the
// station's centre on the plate, +z toward the camera's composed frame, +x to
// its right, y up. The openings it rises through are cut from the plate here,
// in the same frame, so plate and mechanism always agree.

import type { P } from "@/components/flacon/kit";
import { STATIONS, type StationId, stationCenter } from "@/lib/choreography";
import { clamp01 } from "@/lib/sequence";

const rad = (d: number) => (d * Math.PI) / 180;

/** Rotation about y that turns the station's +z toward its camera. */
export function stationYaw(id: StationId): number {
  const a = rad(STATIONS[id].camAngle);
  return Math.atan2(Math.cos(a), Math.sin(a));
}

/** Station-local (x, z) to world (x, z). */
export function toWorld(id: StationId, lx: number, lz: number): [number, number] {
  const c = stationCenter(id);
  const t = stationYaw(id);
  return [c.x + lx * Math.cos(t) + lz * Math.sin(t), c.z - lx * Math.sin(t) + lz * Math.cos(t)];
}

const circle = (cx: number, cz: number, r: number, n = 48): P[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cz + r * Math.sin((i / n) * Math.PI * 2)] as P);
const rect = (cx: number, cz: number, w: number, d: number): P[] => [
  [cx - w / 2, cz - d / 2],
  [cx + w / 2, cz - d / 2],
  [cx + w / 2, cz + d / 2],
  [cx - w / 2, cz + d / 2],
];

// ---------------------------------------------------------------- layouts

export const RESINS = { hatchR: 0.62, tiers: 4, tierH: 0.36, wheel: { x: 0.98, z: 0.15, r: 0.26 } } as const;
export const FLORALS = { size: 2.4, n: 6, basin: 2 } as const;
export const EMBER = { rings: [0.22, 0.34, 0.46, 0.58, 0.7], legR: 0.8, legs: [90, 210, 330] } as const;
export const WOODS = {
  rows: [
    { z: -0.38, n: 17, depth: 0.3 },
    { z: 0.22, n: 17, depth: 0.3 },
  ],
  centreX: -0.4,
  span: 1.9,
  lift: { x: 1.1, z: 0.05, size: 0.46 },
} as const;

/** Openings in station coordinates. */
function holesLocal(id: StationId): P[][] {
  switch (id) {
    case "resins":
      return [circle(0, 0, RESINS.hatchR)];
    case "florals":
      return [rect(0, 0, FLORALS.size, FLORALS.size)];
    case "ember":
      return [
        circle(0, 0, EMBER.rings[EMBER.rings.length - 1]),
        ...EMBER.legs.map((a) => circle(EMBER.legR * Math.cos(rad(a)), EMBER.legR * Math.sin(rad(a)), 0.05, 16)),
      ];
    case "woods":
      return [
        ...WOODS.rows.map((r) => rect(WOODS.centreX, r.z, WOODS.span + 0.12, r.depth + 0.04)),
        rect(WOODS.lift.x, WOODS.lift.z, WOODS.lift.size + 0.04, WOODS.lift.size + 0.04),
      ];
  }
}

/** Every station opening, in plate drawing units (x, y = world z). */
export function stationHoles(): P[][] {
  return (Object.keys(STATIONS) as StationId[]).flatMap((id) =>
    holesLocal(id).map((h) => h.map(([x, z]) => toWorld(id, x, z) as P)),
  );
}

// ---------------------------------------------------------------- motion helpers

/** A ratchet step's phase: the value, and how far into its current move it is (0 when holding). */
export function ratchetPhase(t: number, steps: number, drive = 0.55) {
  const x = clamp01(t) * steps;
  const i = Math.min(Math.floor(x), steps - 1);
  const f = t >= 1 ? 1 : x - i;
  const moving = f < drive ? f / drive : 0;
  const ease = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);
  const move = f >= drive ? 1 : ease(f / drive);
  return { value: (i + move) / steps, moving, step: i };
}
