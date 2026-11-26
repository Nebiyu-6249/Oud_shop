import { describe, expect, it } from "vitest";
import { STATIONS, type StationId, stationCenter } from "@/lib/choreography";
import { polarY } from "@/lib/choreography";
import { ratchetPhase, stationHoles, stationYaw, toWorld } from "./stations";

describe("station frames", () => {
  it("turn each station's +z toward its camera", () => {
    for (const id of Object.keys(STATIONS) as StationId[]) {
      const c = stationCenter(id);
      const [x, z] = toWorld(id, 0, 1);
      const toward = polarY(STATIONS[id].camAngle, 1, 0);
      expect(x - c.x, id).toBeCloseTo(toward.x, 9);
      expect(z - c.z, id).toBeCloseTo(toward.z, 9);
      expect(Number.isFinite(stationYaw(id))).toBe(true);
    }
  });

  it("cut every opening inside the plate", () => {
    for (const hole of stationHoles()) for (const [x, y] of hole) expect(Math.hypot(x, y)).toBeLessThan(9);
  });
});

describe("ratchetPhase", () => {
  it("advances monotonically, holding between steps", () => {
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const r = ratchetPhase(i / 1000, 4);
      expect(r.value).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = r.value;
    }
    expect(ratchetPhase(0.2, 4).moving).toBe(0);
    expect(ratchetPhase(1, 4).value).toBe(1);
  });

  it("gives the same state scrubbing forward or back", () => {
    for (const t of [0.13, 0.5, 0.77]) expect(ratchetPhase(t, 5)).toEqual(ratchetPhase(t, 5));
  });
});
