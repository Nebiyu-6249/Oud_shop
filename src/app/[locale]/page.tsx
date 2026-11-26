import { getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { getFragrance, getFragranceSlugs } from "@/lib/catalog";

// Phase 1 placeholder: the hero, astrolabe and realms arrive in later phases.
export default async function HomePage() {
  const locale = await rootParams.locale();
  const t = await getTranslations("Site");
  const tForm = await getTranslations("Form");
  const fragrances = (await Promise.all((await getFragranceSlugs()).map(getFragrance))).filter(
    (f) => f !== null,
  );

  return (
    <main id="main" className="mx-auto max-w-4xl px-5 py-16 sm:px-10">
      <h1 className="font-display text-5xl tracking-[0.15em] uppercase sm:text-7xl">{t("name")}</h1>
      <p className="mt-4 text-xl text-parchment/80">{t("tagline")}</p>
      <ul className="mt-14">
        {fragrances.map((f) => (
          <li key={f.slug} className="rule border-t last:border-b">
            <Link
              href={`/fragrance/${f.slug}`}
              className="flex items-baseline justify-between gap-4 py-5 hover:text-brass"
            >
              <span className="font-display text-2xl">{locale === "ar" ? f.nameAr : f.nameEn}</span>
              <span className="text-base text-parchment/70">{tForm(f.form)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
