// Reprices a cart from database rows. Pure, so it can be tested on its own.
// The client's idea of a price is never used.

import { lineTotal, vatFromInclusive } from "./money";

export const MAX_QTY = 10;
export const MAX_LINES = 24;

export type CartItem = { variantId: string; qty: number };

export type VariantRow = {
  id: string;
  label: string;
  priceFils: number;
  stock: number;
  sku: string;
  fragrance: { nameEn: string; nameAr: string; slug: string };
};

export type LineError =
  | { code: "NOT_FOUND" }
  | { code: "SHORT_STOCK"; available: number }
  | { code: "BAD_QTY" };

export type PricedLine = {
  variant: VariantRow;
  qty: number;
  unitPriceFils: number;
  lineFils: number;
};

export type PricedCart = {
  lines: PricedLine[];
  totalFils: number;
  vatFils: number;
  /** Keyed by variant id. Empty when the cart can be bought as it stands. */
  errors: Record<string, LineError>;
};

/** Combines duplicate lines and drops anything that is not a sane quantity. */
export function normaliseItems(raw: unknown): CartItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const qty = new Map<string, number>();
  for (const it of raw) {
    if (!it || typeof it !== "object") return null;
    const { variantId, qty: q } = it as Record<string, unknown>;
    if (typeof variantId !== "string" || variantId.length === 0 || variantId.length > 64) return null;
    if (typeof q !== "number" || !Number.isInteger(q)) return null;
    qty.set(variantId, (qty.get(variantId) ?? 0) + q);
  }
  return [...qty].map(([variantId, q]) => ({ variantId, qty: q }));
}

export function priceCart(items: CartItem[], rows: VariantRow[]): PricedCart {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: PricedLine[] = [];
  const errors: Record<string, LineError> = {};
  for (const { variantId, qty } of items) {
    const v = byId.get(variantId);
    if (!v) {
      errors[variantId] = { code: "NOT_FOUND" };
      continue;
    }
    if (qty < 1 || qty > MAX_QTY) {
      errors[variantId] = { code: "BAD_QTY" };
      continue;
    }
    if (v.stock < qty) {
      errors[variantId] = { code: "SHORT_STOCK", available: Math.max(0, v.stock) };
      continue;
    }
    lines.push({ variant: v, qty, unitPriceFils: v.priceFils, lineFils: lineTotal(v.priceFils, qty) });
  }
  const totalFils = lines.reduce((s, l) => s + l.lineFils, 0);
  return { lines, totalFils, vatFils: vatFromInclusive(totalFils), errors };
}
