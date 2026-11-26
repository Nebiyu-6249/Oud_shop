import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/alternates";
import { getRealm, getRealms } from "@/lib/catalog";
import { FragranceCard } from "@/components/realm/fragrance-card";
import { RealmFrameBottom, RealmFrameTop } from "@/components/realm/frames";
import { Ornament } from "@/components/flacon/ornament";
import { STATION_BOTANICAL } from "@/components/stage/plate-design";
import type { StationId } from "@/lib/choreography";
import { REALM_LABEL } from "@/lib/sequence";

export async function generateStaticParams() {
  const realms = await getRealms();
  return realms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/realms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await rootParams.locale();
  const realm = await getRealm(slug);
  if (!realm) return {};
  return {
    title: locale === "ar" ? realm.nameAr : realm.nameEn,
    description: locale === "ar" ? realm.storyAr : realm.storyEn,
    alternates: alternates(locale, `/realms/${slug}`),
  };
}

export default async function RealmPage({ params }: PageProps<"/[locale]/realms/[slug]">) {
  const { slug } = await params;
  const locale = await rootParams.locale();
  const [realm, realms] = await Promise.all([getRealm(slug), getRealms()]);
  if (!realm) notFound();
  const ar = locale === "ar";
  const t = await getTranslations("Realm");
  const others = realms.filter((r) => r.slug !== slug);

  return (
    <main id="main" data-stage-window>
      {/* an open window onto the stage, parked on this realm's mechanism */}
      <header className="relative flex min-h-[88dvh] items-end">
        <div aria-hidden className="stage-poster absolute inset-0 flex items-center justify-center text-realm-accent">
          <Ornament ornamentKey={STATION_BOTANICAL[REALM_LABEL[realm.slug] as StationId]} className="h-[60vmin] w-[60vmin] opacity-25" />
        </div>
        {/* a title card in the lower corner, leaving the mechanism in view */}
        <div className="relative w-full px-5 pb-8 sm:px-10">
          <div className="stage-panel max-w-xl border border-realm-accent/30 px-6 py-6">
            <h1 className="font-display text-4xl leading-tight text-realm-accent sm:text-5xl">
              {ar ? realm.nameAr : realm.nameEn}
            </h1>
            <p className="mt-4 text-lg leading-relaxed">{ar ? realm.storyAr : realm.storyEn}</p>
          </div>
        </div>
      </header>
      <div className="bg-realm-base">
      <RealmFrameTop slug={realm.slug} />

      <section aria-labelledby="perfumes" className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <h2 id="perfumes" className="font-display mb-8 text-2xl text-realm-accent">
          {t("fragrances")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {realm.fragrances.map((f) => (
            <li key={f.slug}>
              <FragranceCard f={f} locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      <RealmFrameBottom slug={realm.slug} />

      <nav aria-labelledby="other-realms" className="mx-auto max-w-6xl px-5 py-12 sm:px-10">
        <h2 id="other-realms" className="font-display text-lg tracking-[0.2em] text-realm-ink/70 uppercase">
          {t("otherRealms")}
        </h2>
        <ul className="mt-4 grid gap-x-8 sm:grid-cols-3">
          {others.map((r) => (
            <li key={r.slug} className="rule border-b">
              <Link href={`/realms/${r.slug}`} className="font-display block py-4 text-xl hover:text-realm-accent">
                {ar ? r.nameAr : r.nameEn}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      </div>
    </main>
  );
}
