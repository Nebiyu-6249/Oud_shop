import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { getRealms } from "@/lib/catalog";
import { paletteStyle } from "@/lib/palette";
import { FragranceCard } from "@/components/realm/fragrance-card";
import { RealmFrameTop } from "@/components/realm/frames";
import { IdleAstrolabe } from "@/components/astrolabe/idle-astrolabe";
import { getFinderData } from "@/lib/finder-data";
import { alternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await rootParams.locale()) };
}

export default async function HomePage() {
  const locale = await rootParams.locale();
  const ar = locale === "ar";
  const t = await getTranslations("Home");
  const tRealm = await getTranslations("Realm");
  const tFinder = await getTranslations("Finder");
  const [realms, { labels }] = await Promise.all([getRealms(), getFinderData(locale)]);

  return (
    <main id="main">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-14 pb-20 sm:px-10 sm:pt-24 sm:pb-28 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">{t("heroTitle")}</h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-realm-ink/85 sm:text-2xl">{t("heroBody")}</p>
          <Link
            href="/finder"
            className="rule font-display mt-10 inline-block border px-6 py-3 text-lg tracking-[0.1em] text-realm-accent hover:border-realm-accent"
          >
            {tFinder("cta")}
          </Link>
        </div>
        <Link
          href="/finder"
          aria-label={tFinder("cta")}
          className="relative mx-auto block aspect-square w-full max-w-[34rem]"
        >
          <span role="img" aria-label={tFinder("idleLabel")} className="absolute inset-0">
            <IdleAstrolabe labels={labels} />
          </span>
        </Link>
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
