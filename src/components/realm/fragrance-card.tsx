import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { FragranceCard as Card } from "@/lib/catalog";
import { formatAED } from "@/lib/money";
import { Flacon } from "@/components/flacon/flacon";

export async function FragranceCard({ f, locale }: { f: Card; locale: string }) {
  const t = await getTranslations("Fragrance");
  const tForm = await getTranslations("Form");
  const name = locale === "ar" ? f.nameAr : f.nameEn;
  return (
    <Link
      href={`/fragrance/${f.slug}`}
      className="group rule flex h-full flex-col border p-5 transition-colors duration-700 hover:border-realm-accent"
    >
      <Flacon
        params={f.flaconParams}
        id={`card-${f.slug}`}
        label={t("flaconLabel", { name })}
        className="mx-auto h-56 w-auto text-realm-accent"
      />
      <h3 className="font-display mt-4 text-2xl group-hover:text-realm-accent">{name}</h3>
      <p className="mt-1 text-base text-realm-ink/70">{tForm(f.form)}</p>
      <p className="mt-auto pt-3 text-base tabular-nums">
        {t("fromPrice", { price: formatAED(f.fromFils, locale) })}
      </p>
    </Link>
  );
}
