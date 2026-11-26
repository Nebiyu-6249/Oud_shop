import { getTranslations } from "next-intl/server";
import type { FragranceDetail } from "@/lib/catalog";
import { getStock } from "@/lib/catalog";
import { formatAED } from "@/lib/money";
import { formatVariantLabel } from "@/lib/units";

type Variants = FragranceDetail["variants"];
const LOW_STOCK = 5;

export async function VariantStock(props: { fragranceId: string; variants: Variants; locale: string }) {
  const stock = await getStock(props.fragranceId);
  return <VariantList variants={props.variants} locale={props.locale} stock={stock} />;
}

/** Prices are static; stock is null while the live read is pending. */
export async function VariantList({
  variants,
  locale,
  stock,
}: {
  variants: Variants;
  locale: string;
  stock: Record<string, number> | null;
}) {
  const t = await getTranslations("Fragrance");
  const status = (id: string) => {
    if (stock === null) return { text: t("stockChecking"), muted: true };
    const n = stock[id] ?? 0;
    if (n <= 0) return { text: t("soldOut"), muted: true };
    if (n <= LOW_STOCK) return { text: t("lowStock", { count: n }), muted: false };
    return { text: t("inStock"), muted: false };
  };

  return (
    <ul className="mt-4" aria-busy={stock === null}>
      {variants.map((v) => {
        const s = status(v.id);
        return (
          <li key={v.id} className="rule flex items-baseline justify-between gap-4 border-t py-3 last:border-b">
            <span className="text-lg">{formatVariantLabel(v.label, locale)}</span>
            <span className={`text-base ${s.muted ? "text-realm-ink/60" : "text-realm-ink/85"}`}>
              {s.text}
            </span>
            <span className="font-display text-lg tabular-nums">{formatAED(v.priceFils, locale)}</span>
          </li>
        );
      })}
    </ul>
  );
}
