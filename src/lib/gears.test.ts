import { describe, expect, it } from "vitest";
import {
  type TrainGear,
  centreDistance,
  gearAngle,
  meshAngle,
  pitchRadius,
  placeTrain,
  toothOutline,
  toothPhase,
} from "./gears";

const g = (id: string, teeth: number, module = 0.1) => ({ id, teeth, module });

/** Two phases interlock when one has a tooth where the other has a gap. */
const interlocks = (pa: number, pb: number) => {
  const s = (pa + pb) % 1;
  return Math.min(Math.abs(s - 0.5), Math.abs(s + 0.5), Math.abs(s - 1.5)) < 1e-9;
};

describe("meshing pair", () => {
  const a = g("a", 12);
  const b = g("b", 30);

  it("turns the opposite way at the inverse tooth ratio", () => {
    const dir = 0.7;
    const d0 = meshAngle(a, b, dir, 0);
    const d1 = meshAngle(a, b, dir, 1);
    expect(d1 - d0).toBeCloseTo(-12 / 30, 12);
  });

  it("interlocks at every angle: a tooth on one side always meets a gap", () => {
    for (const dir of [0, 0.4, 1.9, -2.2]) {
      for (let i = 0; i < 200; i++) {
        const angleA = (i / 200) * Math.PI * 6 - 3;
        const angleB = meshAngle(a, b, dir, angleA);
        // a's contact point faces b along dir; b's faces a along dir + pi
        const pa = toothPhase(a, angleA, dir);
        const pb = toothPhase(b, angleB, dir + Math.PI);
        expect(interlocks(pa, pb), `dir ${dir} angle ${angleA}`).toBe(true);
      }
    }
  });

  it("puts a gap opposite a tooth when the driver's tooth faces the contact", () => {
    const dir = 1.1;
    const angleA = dir; // tooth 0 of a points straight at b
    expect(toothPhase(a, angleA, dir)).toBeCloseTo(0, 12);
    expect(toothPhase(b, meshAngle(a, b, dir, angleA), dir + Math.PI)).toBeCloseTo(0.5, 12);
  });

  it("sits the pitch circles exactly touching", () => {
    expect(centreDistance(a, b)).toBeCloseTo(pitchRadius(a) + pitchRadius(b), 12);
    expect(centreDistance(a, b)).toBeCloseTo((0.1 * 42) / 2, 12);
  });
});

describe("trains", () => {
  const train: TrainGear[] = [
    { ...g("drive", 10), link: { kind: "driver" } },
    { ...g("idler", 17), link: { kind: "mesh", parent: "drive", direction: 0 } },
    { ...g("out", 25), link: { kind: "mesh", parent: "idler", direction: 1.2 } },
    { ...g("compound", 8, 0.06), link: { kind: "shaft", parent: "out" } },
    { ...g("final", 32, 0.06), link: { kind: "mesh", parent: "compound", direction: -0.5 } },
  ];
  const placed = placeTrain(train);
  const by = (id: string) => placed.find((p) => p.id === id)!;

  it("alternates direction along a chain and keeps the overall ratio", () => {
    expect(by("idler").ratio).toBeCloseTo(-10 / 17, 12);
    // an idler reverses twice: out turns the same way as drive, at 10/25
    expect(by("out").ratio).toBeCloseTo(10 / 25, 12);
  });

  it("turns compound gears with their shaft and reduces through them", () => {
    expect(by("compound").ratio).toBe(by("out").ratio);
    expect([by("compound").x, by("compound").y]).toEqual([by("out").x, by("out").y]);
    expect(by("final").ratio).toBeCloseTo(-(10 / 25) * (8 / 32), 12);
  });

  it("interlocks every meshing pair at any driver angle", () => {
    for (let i = 0; i < 100; i++) {
      const drive = i * 0.173;
      for (const p of placed) {
        if (p.direction === undefined || !p.parent) continue;
        const parent = by(p.parent);
        const pa = toothPhase(parent, gearAngle(parent, drive), p.direction);
        const pb = toothPhase(p, gearAngle(p, drive), p.direction + Math.PI);
        expect(interlocks(pa, pb), `${parent.id} to ${p.id}`).toBe(true);
      }
    }
  });

  it("places meshing gears at their centre distance", () => {
    const d = Math.hypot(by("out").x - by("idler").x, by("out").y - by("idler").y);
    expect(d).toBeCloseTo(centreDistance(by("idler"), by("out")), 12);
  });

  it("refuses to mesh gears of different modules", () => {
    expect(() =>
      placeTrain([
        { ...g("a", 10, 0.1), link: { kind: "driver" } },
        { ...g("b", 10, 0.2), link: { kind: "mesh", parent: "a", direction: 0 } },
      ]),
    ).toThrow(/module/);
  });
});

describe("tooth outline", () => {
  it("reaches the tip circle and stays within a pitch", () => {
    const gear = g("t", 20);
    const pts = toothOutline(gear);
    const rMax = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
    expect(rMax).toBeCloseTo(pitchRadius(gear) + gear.module, 9);
    const halfWidth = Math.max(...pts.map(([x, y]) => Math.abs(Math.atan2(y, x))));
    expect(halfWidth).toBeLessThan(Math.PI / gear.teeth);
  });
});
