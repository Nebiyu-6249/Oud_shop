import { describe, expect, it } from "vitest";
import { fragrances } from "../../prisma/seed-data";
import {
  type Candidate,
  THRESHOLD,
  WEAR_CHOICES,
  WHEEL,
  familyMatch,
  findFragrances,
  scoreOne,
  wearMatches,
} from "./finder";

const c = (slug: string, family: Candidate["family"], wear: Candidate["wear"], intensity: number, realmSlug = "r1"): Candidate => ({
  slug,
  family,
  wear,
  intensity,
  realmSlug,
});

describe("familyMatch", () => {
  it("follows the fragrance wheel, wrapping round", () => {
    expect(familyMatch("AMBER", "AMBER")).toBe("same");
    expect(familyMatch("FLORAL", "AMBER")).toBe("neighbour");
    expect(familyMatch("FLORAL", "FRESH")).toBe("neighbour");
    expect(familyMatch("FLORAL", "WOODY")).toBe("opposite");
    expect(familyMatch("AMBER", "FRESH")).toBe("opposite");
  });
});

describe("wearMatches", () => {
  it("treats ANY and BOTH as matching everything", () => {
    expect(wearMatches("ANY", "NIGHT")).toBe(true);
    expect(wearMatches("DAY", "BOTH")).toBe(true);
    expect(wearMatches("DAY", "DAY")).toBe(true);
    expect(wearMatches("DAY", "NIGHT")).toBe(false);
  });
});

describe("scoreOne", () => {
  it("scores a perfect match as 1", () => {
    expect(scoreOne({ family: "WOODY", wear: "NIGHT", intensity: 5 }, c("a", "WOODY", "NIGHT", 5)).score).toBe(1);
  });

  it("gives a neighbouring family half the family credit", () => {
    const s = scoreOne({ family: "WOODY", wear: "NIGHT", intensity: 5 }, c("a", "AMBER", "NIGHT", 5));
    expect(s.score).toBeCloseTo(0.75);
    expect(s.family).toBe("neighbour");
  });

  it("loses a quarter of the intensity credit per step", () => {
    const at = (i: number) => scoreOne({ family: "WOODY", wear: "ANY", intensity: 1 }, c("a", "WOODY", "DAY", i)).score;
    expect(at(1)).toBeCloseTo(1);
    expect(at(2)).toBeCloseTo(0.9375);
    expect(at(5)).toBeCloseTo(0.75);
  });
});

describe("findFragrances", () => {
  it("ranks by score", () => {
    const r = findFragrances({ family: "FLORAL", wear: "DAY", intensity: 2 }, [
      c("opposite", "WOODY", "DAY", 2),
      c("exact", "FLORAL", "DAY", 2),
      c("neighbour", "AMBER", "DAY", 2),
      c("close", "FLORAL", "DAY", 3),
    ]);
    expect(r.picks.map((p) => p.fragrance.slug)).toEqual(["exact", "close", "neighbour"]);
    expect(r.closest).toBe(false);
  });

  it("breaks ties in favour of a realm not yet picked", () => {
    const r = findFragrances({ family: "AMBER", wear: "ANY", intensity: 3 }, [
      c("a1", "AMBER", "DAY", 3, "north"),
      c("a2", "AMBER", "DAY", 3, "north"),
      c("b1", "AMBER", "DAY", 3, "south"),
      c("c1", "AMBER", "DAY", 3, "east"),
    ]);
    expect(r.picks.map((p) => p.fragrance.realmSlug)).toEqual(["north", "south", "east"]);
  });

  it("never lets realm variety beat a higher score", () => {
    const r = findFragrances({ family: "AMBER", wear: "ANY", intensity: 3 }, [
      c("a1", "AMBER", "DAY", 3, "north"),
      c("a2", "AMBER", "DAY", 3, "north"),
      c("b1", "AMBER", "DAY", 4, "south"),
    ]);
    expect(r.picks.map((p) => p.fragrance.slug)).toEqual(["a1", "a2", "b1"]);
  });

  it("flags the closest-we-have case when nothing clears the threshold", () => {
    const r = findFragrances({ family: "FRESH", wear: "NIGHT", intensity: 5 }, [
      c("fresh-day", "FRESH", "DAY", 1),
      c("woody-night", "WOODY", "NIGHT", 5),
      c("floral-night", "FLORAL", "NIGHT", 4),
      c("amber", "AMBER", "NIGHT", 5),
    ]);
    expect(r.picks[0].score).toBeLessThan(THRESHOLD);
    expect(r.closest).toBe(true);
    expect(r.picks).toHaveLength(3);
  });

  it("is deterministic regardless of input order", () => {
    const list = [c("b", "AMBER", "DAY", 3, "x"), c("a", "AMBER", "DAY", 3, "x"), c("c", "AMBER", "DAY", 3, "y")];
    const input = { family: "AMBER", wear: "DAY", intensity: 3 } as const;
    const one = findFragrances(input, list).picks.map((p) => p.fragrance.slug);
    const two = findFragrances(input, [...list].reverse()).picks.map((p) => p.fragrance.slug);
    expect(one).toEqual(two);
    expect(one).toEqual(["a", "c", "b"]);
  });

  it("rejects settings the rings cannot produce", () => {
    expect(() => findFragrances({ family: "AMBER", wear: "ANY", intensity: 0 }, [])).toThrow(RangeError);
    expect(() => findFragrances({ family: "AMBER", wear: "ANY", intensity: 2.5 }, [])).toThrow(RangeError);
  });

  it("always returns three distinct picks from the real catalogue", () => {
    const catalogue = fragrances.map((f) => c(f.slug, f.family, f.wear, f.intensity, f.realmSlug));
    for (const family of WHEEL)
      for (const wear of WEAR_CHOICES)
        for (let intensity = 1; intensity <= 5; intensity++) {
          const r = findFragrances({ family, wear, intensity }, catalogue);
          expect(new Set(r.picks.map((p) => p.fragrance.slug)).size).toBe(3);
          if (!r.closest) expect(r.picks[0].family).toBe("same");
        }
  });
});
