import { describe, expect, it } from "vitest";
import { normaliseItems, priceCart, type VariantRow } from "./cart-pricing";

const row = (id: string, priceFils: number, stock: number): VariantRow => ({
  id,
  label: "50 ml",
  priceFils,
  stock,
  sku: `SKU-${id}`,
  fragrance: { nameEn: id, nameAr: id, slug: id },
});

describe("normaliseItems", () => {
  it("merges duplicate variants", () => {
    expect(normaliseItems([{ variantId: "a", qty: 1 }, { variantId: "a", qty: 2 }])).toEqual([{ variantId: "a", qty: 3 }]);
  });

  it("rejects malformed input", () => {
    expect(normaliseItems([])).toBeNull();
    expect(normaliseItems("a")).toBeNull();
    expect(normaliseItems([{ variantId: "a", qty: 1.5 }])).toBeNull();
    expect(normaliseItems([{ variantId: 3, qty: 1 }])).toBeNull();
  });
});

describe("priceCart", () => {
  it("uses database prices and extracts VAT from the total", () => {
    const r = priceCart([{ variantId: "a", qty: 2 }, { variantId: "b", qty: 1 }], [row("a", 650_00, 5), row("b", 145_00, 5)]);
    expect(r.totalFils).toBe(1_445_00);
    expect(r.vatFils).toBe(Math.round((1_445_00 * 5) / 105));
    expect(r.errors).toEqual({});
  });

  it("reports short stock per line with what is left", () => {
    const r = priceCart([{ variantId: "a", qty: 3 }, { variantId: "b", qty: 1 }], [row("a", 100, 2), row("b", 100, 0)]);
    expect(r.errors).toEqual({ a: { code: "SHORT_STOCK", available: 2 }, b: { code: "SHORT_STOCK", available: 0 } });
    expect(r.lines).toHaveLength(0);
  });

  it("flags unknown variants and silly quantities", () => {
    const r = priceCart([{ variantId: "x", qty: 1 }, { variantId: "a", qty: 0 }, { variantId: "b", qty: 11 }], [row("a", 100, 50), row("b", 100, 50)]);
    expect(r.errors.x).toEqual({ code: "NOT_FOUND" });
    expect(r.errors.a).toEqual({ code: "BAD_QTY" });
    expect(r.errors.b).toEqual({ code: "BAD_QTY" });
  });
});
