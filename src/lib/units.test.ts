import { describe, expect, it } from "vitest";
import { formatVariantLabel, parseVariantLabel } from "./units";

describe("variant labels", () => {
  it("parses amount and unit", () => {
    expect(parseVariantLabel("50 ml")).toEqual({ amount: 50, unit: "ml" });
    expect(parseVariantLabel("60 g")).toEqual({ amount: 60, unit: "g" });
  });

  it("rejects anything else", () => {
    expect(() => parseVariantLabel("50ml")).toThrow();
    expect(() => parseVariantLabel("1.7 oz")).toThrow();
  });

  it("translates the unit", () => {
    expect(formatVariantLabel("12 ml", "en")).toBe("12 ml");
    expect(formatVariantLabel("60 g", "ar")).toMatch(/غ$/);
  });
});
