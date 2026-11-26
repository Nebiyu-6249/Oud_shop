import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { getRealms } from "@/lib/catalog";
import { paletteStyle } from "@/lib/palette";
import { BEATS, REALM_LABEL } from "@/lib/sequence";
import { FragranceCard } from "@/components/realm/fragrance-card";
import { AstrolabeStatic } from "@/components/astrolabe/astrolabe-static";
import { buildModel } from "@/components/astrolabe/model";
import { getFinderData } from "@/lib/finder-data";
import { alternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await rootParams.locale()) };
}

/** Progress window in which a beat's overlay is shown, around its label. */
const WINDOW: Record<string, [number, number]> = {
  rim: [-1, 0.07],
  descent: [0.15, 0.25],
  resins: [0.28, 0.4],
  florals: [0.43, 0.53],
  ember: [0.6, 0.72],
  woods: [0.76, 0.86],
  ascent: [0.95, 2],
};

const firstSentence = (s: string) => s.split(/(?<=[.!?۔])\s/)[0];

export default async function HomePage() {
  const locale = await rootParams.locale();
  const ar = locale === "ar";
  const t = await getTranslations("Home");
  const tFinder = await getTranslations("Finder");
  const [realms, { labels }] = await Promise.all([getRealms(), getFinderData(locale)]);
  const realmFor = (label: string) => realms.find((r) => REALM_LABEL[r.slug] === label);

  const beatStyle = (label: string) =>
    ({ "--a": WINDOW[label][0], "--b": WINDOW[label][1] }) as CSSProperties;
  const beatData = (label: string) => ({ "data-a": WINDOW[label][0], "data-b": WINDOW[label][1] });

  return (
    <main id="main">
      {/*
        The title sequence: 700vh of scroll scrub the master timeline. The 3D
        stage is fixed behind this section; the overlays below are real text,
        each shown while the camera holds on its beat.
      */}
      <section id="sequence" aria-label={t("sequenceLabel")} className="relative" style={{ height: "700vh" }}>
        <div className="sticky top-0 h-dvh overflow-hidden">
          {/* Until the stage loads: the engraved band, drawn as server-rendered line work. */}
          <div aria-hidden className="stage-poster absolute inset-0 text-realm-accent">
            <AstrolabeStatic
              model={buildModel(labels)}
              className="absolute top-[18%] start-[8%] aspect-square w-[220vmax] max-w-none opacity-60"
            />
          </div>

          {BEATS.map(({ label }) => {
            if (label === "rim") {
              return (
                <div key={label} data-beat={label} data-active {...beatData(label)} className="beat absolute inset-0 flex items-center" style={beatStyle(label)}>
                  <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
                    <div className="max-w-2xl">
                      <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">{t("heroTitle")}</h1>
                      <p className="mt-8 text-xl leading-relaxed text-realm-ink/90 sm:text-2xl">{t("heroBody")}</p>
                      <p className="mt-10 text-base text-realm-ink/70">{t("scrollHint")}</p>
                    </div>
                  </div>
                </div>
              );
            }
            const realm = realmFor(label);
            const title =
              label === "descent" ? t("descentTitle") : label === "ascent" ? t("ascentTitle") : ar ? realm!.nameAr : realm!.nameEn;
            const line =
              label === "descent"
                ? t("descentLine")
                : label === "ascent"
                  ? null
                  : firstSentence(ar ? realm!.storyAr : realm!.storyEn);
            return (
              <div
                key={label}
                data-beat={label}
                {...beatData(label)}
                className={`beat absolute inset-0 flex ${label === "ascent" ? "items-end justify-center pb-[12vh]" : "items-end pb-[10vh]"}`}
                style={{ ...beatStyle(label), ...(realm ? paletteStyle(realm.palette) : {}) }}
              >
                <div
                  className={`mx-auto w-full px-5 sm:px-10 ${label === "ascent" ? "max-w-xl border border-realm-accent/40 bg-night/85 py-8 text-center" : "max-w-7xl"}`}
                >
                  <h2 data-engrave className="font-display text-4xl text-realm-accent sm:text-6xl">
                    {title}
                  </h2>
                  {line && (
                    <p data-engrave-line className="mt-4 max-w-xl text-lg leading-relaxed text-realm-ink/90 sm:text-xl">
                      {line}
                    </p>
                  )}
                  {realm && (
                    <Link
                      href={`/realms/${realm.slug}`}
                      className="beat-link mt-6 inline-block text-base text-realm-accent underline underline-offset-4"
                    >
                      {t("visitRealm")}
                    </Link>
                  )}
                  {label === "ascent" && (
                    <Link
                      href="/finder"
                      className="beat-link rule font-display mt-8 inline-block border px-8 py-3 text-xl tracking-[0.1em] text-realm-accent hover:border-realm-accent"
                    >
                      {t("ascentCta")}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="relative bg-night">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-10">
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
          <p className="mt-10">
            <Link href="/finder" className="text-realm-accent underline underline-offset-4">
              {tFinder("cta")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
