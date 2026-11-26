// Variant labels are stored as "50 ml" or "60 g"; the unit is translated here.

export type VariantSize = { amount: number; unit: "ml" | "g" };

export function parseVariantLabel(label: string): VariantSize {
  const m = /^(\d+) (ml|g)$/.exec(label);
  if (!m) throw new Error(`variant label must look like "50 ml" or "60 g", got "${label}"`);
  return { amount: Number(m[1]), unit: m[2] as VariantSize["unit"] };
}

const UNITS: Record<string, Record<VariantSize["unit"], string>> = {
  en: { ml: "ml", g: "g" },
  ar: { ml: "مل", g: "غ" },
};

export function formatVariantLabel(label: string, locale: string): string {
  const { amount, unit } = parseVariantLabel(label);
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE").format(amount);
  return `${n} ${(UNITS[locale] ?? UNITS.en)[unit]}`;
}
