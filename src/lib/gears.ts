// Spur gear trains in the plane. Every gear's angle is derived from one
// driving angle, so a train is a pure function of the master timeline.
//
// Conventions: positions are (x, y) in the gear plane, angles in radians,
// counter-clockwise positive. Gears that mesh share a module (tooth size), so
// their pitch circles touch: centre distance = module * (Na + Nb) / 2.

export type GearSpec = {
  id: string;
  teeth: number;
  /** Tooth size: pitch diameter divided by tooth count. */
  module: number;
};

export type GearLink =
  /** The driver: its angle is the train's input. */
  | { kind: "driver" }
  /** Meshes with `parent`, placed at `direction` radians from it. */
  | { kind: "mesh"; parent: string; direction: number }
  /** Fixed to `parent`'s shaft: same centre, same angle (a compound gear). */
  | { kind: "shaft"; parent: string };

export type TrainGear = GearSpec & { link: GearLink };

export type PlacedGear = GearSpec & {
  x: number;
  y: number;
  /** Angle at driver angle 0, so teeth interlock. */
  phase: number;
  /** Angular velocity relative to the driver: signed, so the sign is the direction. */
  ratio: number;
  /** Line of centres from the parent, for meshing gears. */
  direction?: number;
  parent?: string;
};

export const pitchRadius = (g: Pick<GearSpec, "teeth" | "module">) => (g.module * g.teeth) / 2;
export const tipRadius = (g: Pick<GearSpec, "teeth" | "module">) => pitchRadius(g) + g.module;
export const rootRadius = (g: Pick<GearSpec, "teeth" | "module">) => pitchRadius(g) - 1.25 * g.module;
export const centreDistance = (a: GearSpec, b: GearSpec) => pitchRadius(a) + pitchRadius(b);
export const pitchAngle = (g: Pick<GearSpec, "teeth">) => (Math.PI * 2) / g.teeth;

/**
 * The angle of gear b, meshing with gear a at `direction` (the line of
 * centres from a to b), when a stands at `angleA`.
 *
 * Velocity: b turns at -Na/Nb times a, the opposite way at the inverse tooth
 * ratio. Phase: when a has a tooth on the line of centres, b must present a
 * gap there, so b is offset by half its own pitch (pi / Nb) beyond facing a.
 */
export function meshAngle(a: GearSpec, b: GearSpec, direction: number, angleA: number): number {
  return -(a.teeth / b.teeth) * (angleA - direction) + direction + Math.PI + Math.PI / b.teeth;
}

/**
 * Where tooth k of a gear sits relative to a direction, as a fraction of one
 * tooth pitch: 0 means a tooth is centred on that direction, 0.5 a gap.
 */
export function toothPhase(g: GearSpec, angle: number, direction: number): number {
  const f = (direction - angle) / pitchAngle(g);
  return ((f % 1) + 1) % 1;
}

/** Lays out a train: positions, interlocking phases and ratios to the driver. */
export function placeTrain(train: TrainGear[], origin: { x: number; y: number } = { x: 0, y: 0 }): PlacedGear[] {
  const placed = new Map<string, PlacedGear>();
  for (const g of train) {
    const { link, ...spec } = g;
    if (link.kind === "driver") {
      placed.set(g.id, { ...spec, x: origin.x, y: origin.y, phase: 0, ratio: 1 });
      continue;
    }
    const p = placed.get(link.parent);
    if (!p) throw new Error(`gear ${g.id}: parent ${link.parent} must come before it`);
    if (link.kind === "shaft") {
      placed.set(g.id, { ...spec, x: p.x, y: p.y, phase: p.phase, ratio: p.ratio, parent: p.id });
      continue;
    }
    if (p.module !== g.module) throw new Error(`gear ${g.id}: module must match ${p.id} to mesh`);
    const d = centreDistance(p, g);
    placed.set(g.id, {
      ...spec,
      x: p.x + d * Math.cos(link.direction),
      y: p.y + d * Math.sin(link.direction),
      phase: meshAngle(p, g, link.direction, p.phase),
      ratio: -p.ratio * (p.teeth / g.teeth),
      direction: link.direction,
      parent: p.id,
    });
  }
  return [...placed.values()];
}

/** Each gear's angle for a given driver angle. Linear in the driver, so reversible. */
export const gearAngle = (g: PlacedGear, driver: number) => g.phase + g.ratio * driver;

/**
 * Outline of one tooth in local coordinates, centred on the +x axis: from just
 * inside the root circle out to the tip, flanks narrowing toward the tip the
 * way an involute does. Instanced N times around the gear.
 */
export function toothOutline(g: Pick<GearSpec, "teeth" | "module">): [number, number][] {
  const rp = pitchRadius(g);
  const ra = tipRadius(g);
  const rf = rootRadius(g);
  // half tooth thickness, as an angle, at the root, pitch and tip circles
  const halfPitch = Math.PI / g.teeth / 2;
  const at = (r: number, half: number): [number, number] => [r * Math.cos(half), r * Math.sin(half)];
  const flank: [number, [number, number]][] = [
    [rf - 0.2 * g.module, at(rf - 0.2 * g.module, halfPitch * 1.32)],
    [rf, at(rf, halfPitch * 1.28)],
    [rp, at(rp, halfPitch)],
    [(rp + ra) / 2, at((rp + ra) / 2, halfPitch * 0.78)],
    [ra, at(ra, halfPitch * 0.5)],
  ];
  const upper = flank.map(([, p]) => p);
  const lower = [...upper].reverse().map(([x, y]) => [x, -y] as [number, number]);
  return [...upper, ...lower];
}
