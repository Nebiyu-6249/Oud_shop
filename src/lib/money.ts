// All money is integer fils (1 AED = 100 fils). Prices are VAT-inclusive.

export const VAT_RATE_PERCENT = 5;

/** VAT contained in a VAT-inclusive total: round(total * 5 / 105). */
export function vatFromInclusive(totalFils: number): number {
  assertFils(totalFils);
  return Math.round((totalFils * VAT_RATE_PERCENT) / (100 + VAT_RATE_PERCENT));
}

export function lineTotal(unitPriceFils: number, qty: number): number {
  assertFils(unitPriceFils);
  if (!Number.isInteger(qty) || qty < 0) {
    throw new RangeError(`qty must be a non-negative integer, got ${qty}`);
  }
  return unitPriceFils * qty;
}

export function formatAED(fils: number, locale: string): string {
  assertFils(fils);
  const tag = locale === "ar" ? "ar-AE" : "en-AE";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: fils % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(fils / 100);
}

function assertFils(n: number) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`fils must be a non-negative integer, got ${n}`);
  }
}
