import { describe, expect, it } from "vitest";
import { fragrances, notes } from "../../../prisma/seed-data";
import { SILHOUETTES, STOPPERS, ENGRAVINGS, type FlaconParams } from "@/lib/flacon";
import { BOTANICAL_KEYS, botanical } from "./botanicals";
import { VIEW_H, VIEW_W, buildFlacon } from "./geometry";

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

function allPaths(p: FlaconParams) {
  const f = buildFlacon(p);
  return [f.body, f.cartouche.d, ...f.inside.map((s) => s.d), ...f.outside.map((s) => s.d)];
}

describe("buildFlacon", () => {
  it("draws every seeded bottle with finite coordinates inside the view box", () => {
    for (const f of fragrances) {
      const paths = allPaths(f.flaconParams);
      for (const d of paths) expect(d).not.toMatch(/NaN|Infinity/);
      // The outline and stopper must fit; hatching is clipped so it may overrun.
      const f2 = buildFlacon(f.flaconParams);
      const ys = [f2.body, ...f2.outside.map((s) => s.d)]
        .flatMap((d) => numbers(d.replace(/[aA][^MLCQZ]*/g, "")))
        .filter((_, i) => i % 2 === 1);
      expect(Math.min(...ys), f.slug).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ys), f.slug).toBeLessThanOrEqual(VIEW_H);
    }
  });

  it("handles every combination of silhouette, stopper and engraving", () => {
    for (const silhouette of SILHOUETTES)
      for (const stopper of STOPPERS)
        for (const engraving of ENGRAVINGS) {
          const paths = allPaths({ silhouette, stopper, engraving, aspect: 0.7, shoulder: 0.5, neck: 0.15, ornament: "rose" });
          for (const d of paths) expect(d).not.toMatch(/NaN|Infinity/);
        }
    expect(VIEW_W).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const p = fragrances[0].flaconParams;
    expect(buildFlacon(p)).toEqual(buildFlacon(p));
  });
});

describe("botanicals", () => {
  it("has a drawing for every note and every flacon ornament", () => {
    for (const n of notes) expect(BOTANICAL_KEYS).toContain(n.ornamentKey);
    for (const f of fragrances) expect(BOTANICAL_KEYS).toContain(f.flaconParams.ornament);
  });

  it("draws finite paths", () => {
    for (const k of BOTANICAL_KEYS) {
      const strokes = botanical(k);
      expect(strokes.length).toBeGreaterThan(3);
      for (const s of strokes) expect(s.d).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});
