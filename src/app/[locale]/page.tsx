import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { getRealms } from "@/lib/catalog";
import { paletteStyle } from "@/lib/palette";
import { FragranceCard } from "@/components/realm/fragrance-card";
import { RealmFrameTop } from "@/components/realm/frames";

// The idle astrolabe joins the hero in phase 3.
export default async function HomePage() {
  const locale = await rootParams.locale();
  const ar = locale === "ar";
  const t = await getTranslations("Home");
  const tRealm = await getTranslations("Realm");
  const realms = await getRealms();

  return (
    <main id="main">
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 sm:px-10 sm:pt-28 sm:pb-32">
        <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">{t("heroTitle")}</h1>
        <p className="mt-8 max-w-2xl text-xl leading-relaxed text-realm-ink/85 sm:text-2xl">{t("heroBody")}</p>
      </section>

      <section id="realms" aria-labelledby="realms-heading">
        <h2 id="realms-heading" className="font-display mx-auto max-w-6xl px-5 pb-6 text-sm tracking-[0.25em] text-realm-accent uppercase sm:px-10">
          {t("realmsHeading")}
        </h2>
        <ul>
          {realms.map((r) => (
            <li key={r.slug} style={paletteStyle(r.palette) as CSSProperties} className="bg-realm-base text-realm-ink">
              <RealmFrameTop slug={r.slug} />
              <Link
                href={`/realms/${r.slug}`}
                className="group mx-auto grid max-w-6xl gap-4 px-5 py-12 sm:grid-cols-[1fr_1.4fr] sm:px-10"
                aria-label={tRealm("enter", { realm: ar ? r.nameAr : r.nameEn })}
              >
                <span className="font-display text-4xl text-realm-accent group-hover:underline group-hover:underline-offset-8">
                  {ar ? r.nameAr : r.nameEn}
                </span>
                <span className="text-lg leading-relaxed text-realm-ink/85">{ar ? r.storyAr : r.storyEn}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-5 py-20 sm:px-10">
        <h2 id="featured-heading" className="font-display mb-8 text-sm tracking-[0.25em] text-realm-accent uppercase">
          {t("featuredHeading")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {realms.map((r) => (
            <li key={r.slug} style={paletteStyle(r.palette) as CSSProperties} className="bg-realm-base text-realm-ink">
              <FragranceCard f={r.fragrances[0]} locale={locale} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
