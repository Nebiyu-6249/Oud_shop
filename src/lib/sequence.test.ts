import { describe, expect, it } from "vitest";
import { gsap } from "gsap";
import { BEATS, createMasterTimeline, nearestLabel, ratchet, stage, stepLabel } from "./sequence";
import { HOLD, STATIONS, type StationId, cameraAt, cameraT, structureState } from "./choreography";

describe("labels", () => {
  it("run in order from 0 to 1", () => {
    const at = BEATS.map((b) => b.at);
    expect(at[0]).toBe(0);
    expect(at[at.length - 1]).toBe(1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("step beat to beat in both directions", () => {
    expect(stepLabel(0, 1)).toBe("descent");
    expect(stepLabel(0.32, 1)).toBe("florals");
    expect(stepLabel(0.32, -1)).toBe("descent");
    expect(stepLabel(1, 1)).toBe("ascent");
    expect(stepLabel(0, -1)).toBe("rim");
    expect(nearestLabel(0.5)).toBe("florals");
  });
});

describe("ratchet", () => {
  it("is monotonic, starts at 0 and ends at 1", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const v = ratchet(i / 1000, 4);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(ratchet(0, 4)).toBe(0);
    expect(ratchet(1, 4)).toBe(1);
  });

  it("holds between steps", () => {
    // late in the first slot the first step is complete and waiting
    expect(ratchet(0.2, 4)).toBeCloseTo(0.25);
    expect(ratchet(0.24, 4)).toBeCloseTo(0.25);
  });
});

describe("stage", () => {
  it("runs sequential stages that together cover the window", () => {
    expect(stage(0, 0, 3)).toBe(0);
    expect(stage(1, 2, 3)).toBe(1);
    expect(stage(0.1, 2, 3)).toBe(0);
  });
});

describe("camera", () => {
  it("rests on each label's frame through its hold", () => {
    for (const b of BEATS.slice(0, -1)) {
      const a = cameraAt(b.at).pos.clone();
      const c = cameraAt(b.at + HOLD * 0.9).pos.clone();
      expect(a.distanceTo(c), b.label).toBeLessThan(1e-9);
    }
  });

  it("moves continuously: no jumps between neighbouring scroll positions", () => {
    let prev = cameraAt(0).pos.clone();
    for (let i = 1; i <= 4000; i++) {
      const cur = cameraAt(i / 4000).pos.clone();
      expect(cur.distanceTo(prev)).toBeLessThan(0.25);
      prev = cur;
    }
  });

  it("is monotonic along its spline", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const t = cameraT(i / 1000);
      expect(t).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = t;
    }
  });

  it("ends looking down on the whole instrument", () => {
    const { pos } = cameraAt(1);
    expect(pos.y).toBeGreaterThan(40);
  });
});

describe("structures", () => {
  const ids = Object.keys(STATIONS) as StationId[];

  it("are flat before their approach and fully risen at their label", () => {
    const at: Record<StationId, number> = { resins: 0.32, florals: 0.47, ember: 0.64, woods: 0.8 };
    for (const id of ids) {
      expect(structureState(id, at[id] - 0.12), id).toBe(0);
      expect(structureState(id, at[id]), id).toBe(1);
    }
  });

  it("fold flat again by the end of the ascent, woods first", () => {
    for (const id of ids) expect(structureState(id, 1), id).toBe(0);
    expect(structureState("woods", 0.89)).toBe(0);
    expect(structureState("resins", 0.89)).toBe(1);
  });
});

describe("master timeline", () => {
  it("reports the same progress scrubbing forward and back", () => {
    const seen: number[] = [];
    const tl = createMasterTimeline(gsap, (p) => seen.push(p));
    tl.progress(0.47);
    const forward = seen[seen.length - 1];
    tl.progress(0.9);
    tl.progress(0.47);
    expect(seen[seen.length - 1]).toBeCloseTo(forward, 12);
    expect(forward).toBeCloseTo(0.47, 12);
    expect(tl.labels.ember).toBe(0.64);
  });
});

describe("compact camera path", () => {
  it("is shorter than the full one through the six beats before the climb", async () => {
    const { pathLength } = await import("./choreography");
    expect(pathLength("compact")).toBeLessThan(pathLength("full"));
  });

  it("still holds on every label and moves continuously", async () => {
    const { cameraAt: at } = await import("./choreography");
    let prev = at(0, undefined, "compact").pos.clone();
    for (let i = 1; i <= 4000; i++) {
      const cur = at(i / 4000, undefined, "compact").pos.clone();
      expect(cur.distanceTo(prev)).toBeLessThan(0.6);
      prev = cur;
    }
    for (const b of BEATS.slice(0, -1)) {
      expect(at(b.at, undefined, "compact").pos.distanceTo(at(b.at + HOLD * 0.9, undefined, "compact").pos)).toBeLessThan(1e-9);
    }
  });
});
