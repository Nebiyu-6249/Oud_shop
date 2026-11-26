import { getTranslations } from "next-intl/server";
import type { FragranceDetail } from "@/lib/catalog";
import { getStock } from "@/lib/catalog";
import { formatAED } from "@/lib/money";
import { formatVariantLabel } from "@/lib/units";
import { VariantPicker } from "@/components/cart/variant-picker";

type Variants = FragranceDetail["variants"];
const LOW_STOCK = 5;

/** Live stock, read per request, feeding the add-to-cart picker. */
export async function VariantStock(props: { fragranceId: string; variants: Variants; locale: string }) {
  const [stock, t, tCart] = await Promise.all([
    getStock(props.fragranceId),
    getTranslations("Fragrance"),
    getTranslations("Cart"),
  ]);
  const status = (n: number) =>
    n <= 0 ? t("soldOut") : n <= LOW_STOCK ? t("lowStock", { count: n }) : t("inStock");
  return (
    <VariantPicker
      variants={props.variants.map((v) => ({
        id: v.id,
        label: formatVariantLabel(v.label, props.locale),
        price: formatAED(v.priceFils, props.locale),
        stock: stock[v.id] ?? 0,
        status: status(stock[v.id] ?? 0),
      }))}
      strings={{
        size: t("size"),
        quantity: t("quantity"),
        add: t("addToCart"),
        added: t("added"),
        viewCart: t("viewCart"),
        decrease: tCart("decrease"),
        increase: tCart("increase"),
      }}
    />
  );
}

/** The static shell shown while stock is read: prices, no controls. */
export async function VariantList({ variants, locale }: { variants: Variants; locale: string }) {
  const t = await getTranslations("Fragrance");
  return (
    <ul className="mt-4" aria-busy>
      {variants.map((v) => (
        <li key={v.id} className="rule flex items-baseline justify-between gap-4 border-t py-3 last:border-b">
          <span className="text-lg">{formatVariantLabel(v.label, locale)}</span>
          <span className="text-base text-realm-ink/60">{t("stockChecking")}</span>
          <span className="font-display text-lg tabular-nums">{formatAED(v.priceFils, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
