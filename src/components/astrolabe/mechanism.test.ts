import { describe, expect, it } from "vitest";
import { Channel, heavyEase, nearestTurn } from "./mechanism";
import { detentAngle, ringAt, R } from "./geometry";

describe("heavyEase", () => {
  it("starts at 0, ends at 1 and starts slowly", () => {
    expect(heavyEase(0)).toBe(0);
    expect(heavyEase(1)).toBe(1);
    expect(heavyEase(0.1)).toBeLessThan(0.01);
  });

  it("overshoots slightly just before the end, then settles", () => {
    expect(heavyEase(0.93)).toBeGreaterThan(1);
  });
});

describe("nearestTurn", () => {
  it("picks the equivalent angle closest to the current one", () => {
    expect(nearestTurn(350, 0)).toBe(360);
    expect(nearestTurn(-170, 180)).toBe(-180);
    expect(nearestTurn(10, 0)).toBe(0);
  });
});

describe("Channel", () => {
  it("settles on the target by the short way round", () => {
    const c = new Channel(350);
    c.settle(0, false);
    c.step(0, 16);
    for (let t = 0; t <= 3000; t += 16) c.step(t, 16);
    expect(c.value).toBe(360);
    expect(c.moving).toBe(false);
  });

  it("jumps straight there under reduced motion", () => {
    const c = new Channel(0);
    c.settle(-90, true);
    expect(c.value).toBe(-90);
    expect(c.moving).toBe(false);
  });

  it("sweeps through targets and ends on the last", () => {
    const c = new Channel(0);
    c.sweep([30, 120, 60], false);
    const seen: number[] = [];
    for (let t = 0; t <= 8000; t += 16) {
      c.step(t, 16);
      seen.push(c.value);
    }
    expect(Math.max(...seen)).toBeGreaterThan(110);
    expect(c.value).toBe(60);
  });

  it("drifts while idle", () => {
    const c = new Channel(0);
    c.drift = 10;
    c.step(0, 1000);
    expect(c.value).toBeCloseTo(10);
  });
});

describe("geometry", () => {
  it("puts detent 0 at the top", () => {
    expect(detentAngle(0, 4)).toBe(-90);
    expect(detentAngle(1, 4)).toBe(0);
  });

  it("maps a radius to the ring under it", () => {
    expect(ringAt((R.reteOuter + R.reteInner) / 2)).toBe("rete");
    expect(ringAt((R.wearOuter + R.wearInner) / 2)).toBe("wear");
    expect(ringAt(0.2)).toBe("plate");
    expect(ringAt(0.01)).toBeNull();
    expect(ringAt(0.82)).toBeNull();
  });
});
