import { describe, expect, it } from "vitest";
import { formatAED, lineTotal, vatFromInclusive } from "./money";

describe("vatFromInclusive", () => {
  it("extracts 5% VAT from an inclusive total", () => {
    expect(vatFromInclusive(105_00)).toBe(5_00);
    expect(vatFromInclusive(1_150_00)).toBe(5_476);
  });

  it("rounds to the nearest fils", () => {
    // 1 * 5 / 105 = 0.047...
    expect(vatFromInclusive(1)).toBe(0);
    // 21 * 5 / 105 = 1 exactly
    expect(vatFromInclusive(21)).toBe(1);
    // 11 * 5 / 105 = 0.523...
    expect(vatFromInclusive(11)).toBe(1);
  });

  it("is zero for a zero total", () => {
    expect(vatFromInclusive(0)).toBe(0);
  });

  it("rejects fractional or negative fils", () => {
    expect(() => vatFromInclusive(10.5)).toThrow(RangeError);
    expect(() => vatFromInclusive(-1)).toThrow(RangeError);
  });
});

describe("lineTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(lineTotal(680_00, 3)).toBe(2_040_00);
  });

  it("rejects a fractional quantity", () => {
    expect(() => lineTotal(100, 1.5)).toThrow(RangeError);
  });
});

describe("formatAED", () => {
  it("drops decimals on whole dirhams", () => {
    expect(formatAED(1_150_00, "en")).toMatch(/1,150/);
    expect(formatAED(1_150_00, "en")).not.toMatch(/\.00/);
  });

  it("keeps two decimals when there are fils", () => {
    expect(formatAED(54_76, "en")).toMatch(/54\.76/);
  });
});
