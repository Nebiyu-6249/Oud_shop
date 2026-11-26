import { describe, expect, it } from "vitest";
import { HOUSE, LAMP, beatPalettes, lampAt, mix, paletteAt } from "./grade";

const realms = {
  "frost-cloister": { base: "#0a0d10", surface: "#141b21", accent: "#a9c1cf", ink: "#e4e8e8", glow: "#4f6b7e" },
  "still-water-garden": { base: "#081110", surface: "#10201e", accent: "#4fb3a9", ink: "#f2e8da", glow: "#c27a72" },
  "ember-kiln": { base: "#0b0807", surface: "#1a1210", accent: "#c9a24a", ink: "#efe3cb", glow: "#9e2a1c" },
  caravanserai: { base: "#120d08", surface: "#231910", accent: "#d19a48", ink: "#f0e2c8", glow: "#7a4a2a" },
};
const P = beatPalettes(realms);

describe("grade", () => {
  it("is each realm's own palette at its beat and the house palette at the ends", () => {
    expect(paletteAt(0.32, P)).toEqual(realms["frost-cloister"]);
    expect(paletteAt(0.64, P)).toEqual(realms["ember-kiln"]);
    expect(paletteAt(0, P)).toEqual(HOUSE);
    expect(paletteAt(1, P)).toEqual(HOUSE);
  });

  it("blends between beats without leaving the two colours' range", () => {
    const mid = paletteAt(0.395, P).accent;
    expect(mid).not.toBe(realms["frost-cloister"].accent);
    expect(mid).not.toBe(realms["still-water-garden"].accent);
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("hands the light to the brazier in the Ember beat", () => {
    expect(lampAt(0.64).strength).toBeCloseTo(LAMP.ember.strength, 9);
    expect(lampAt(0.32).color).toBe(LAMP.resins.color);
  });

  it("is a pure function: same progress, same grade", () => {
    for (const p of [0.11, 0.5, 0.93]) expect(paletteAt(p, P)).toEqual(paletteAt(p, P));
  });
});
