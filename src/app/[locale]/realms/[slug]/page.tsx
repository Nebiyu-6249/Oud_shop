import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { Link } from "@/i18n/navigation";
import { alternates } from "@/i18n/alternates";
import { getRealm, getRealms } from "@/lib/catalog";
import { FragranceCard } from "@/components/realm/fragrance-card";
import { RealmFrameBottom, RealmFrameTop } from "@/components/realm/frames";

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
    <main id="main">
      <RealmFrameTop slug={realm.slug} />
      <header className="mx-auto max-w-4xl px-5 py-16 sm:px-10 sm:py-24">
        <h1 className="font-display text-5xl leading-tight text-realm-accent sm:text-7xl">
          {ar ? realm.nameAr : realm.nameEn}
        </h1>
        <p data-reveal="lines" className="mt-8 max-w-2xl text-xl leading-relaxed sm:text-2xl">{ar ? realm.storyAr : realm.storyEn}</p>
      </header>

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
    </main>
  );
}
