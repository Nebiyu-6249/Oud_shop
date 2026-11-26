import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { Suspense, type CSSProperties } from "react";
import { getFragrance, getFragranceSlugs } from "@/lib/catalog";
import { paletteStyle } from "@/lib/palette";
import { NotesDisplay } from "@/components/fragrance/notes-display";
import { IntensityMarks } from "@/components/fragrance/intensity-marks";
import { VariantList, VariantStock } from "@/components/fragrance/variant-list";

export async function generateStaticParams() {
  const slugs = await getFragranceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/fragrance/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await rootParams.locale();
  const f = await getFragrance(slug);
  if (!f) return {};
  return { title: locale === "ar" ? f.nameAr : f.nameEn };
}

export default async function FragrancePage({ params }: PageProps<"/[locale]/fragrance/[slug]">) {
  const { slug } = await params;
  const locale = await rootParams.locale();
  const f = await getFragrance(slug);
  if (!f) notFound();

  const ar = locale === "ar";
  const t = await getTranslations("Fragrance");
  const tFamily = await getTranslations("Family");
  const tForm = await getTranslations("Form");
  const tWear = await getTranslations("Wear");

  return (
    <main
      id="main"
      style={paletteStyle(f.realm.palette) as CSSProperties}
      className="bg-realm-base text-realm-ink"
    >
      <article className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-10 lg:grid-cols-[1fr_1.2fr] lg:py-20">
        <header className="lg:col-span-2">
          <p className="font-display text-sm tracking-[0.25em] text-realm-accent uppercase">
            {ar ? f.realm.nameAr : f.realm.nameEn}
          </p>
          <h1 className="font-display mt-3 text-5xl leading-tight sm:text-6xl">
            {ar ? f.nameAr : f.nameEn}
          </h1>
          <p className="mt-2 text-realm-ink/75">{tForm(f.form)}</p>
        </header>

        <section className="space-y-8">
          <p className="text-xl leading-relaxed">{ar ? f.storyAr : f.storyEn}</p>

          <dl className="rule grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-base">
            <div>
              <dt className="text-realm-ink/65">{t("family")}</dt>
              <dd>
                {tFamily(f.family)}
                <span className="text-realm-ink/65">, {f.subfamily}</span>
              </dd>
            </div>
            <div>
              <dt className="text-realm-ink/65">{t("wear")}</dt>
              <dd>{tWear(f.wear)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-realm-ink/65">{t("intensity")}</dt>
              <dd>
                <IntensityMarks value={f.intensity} label={t("intensityValue", { value: f.intensity })} />
              </dd>
            </div>
          </dl>
        </section>

        <div className="space-y-10">
          <section aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="font-display text-2xl text-realm-accent">
              {t("notes")}
            </h2>
            <NotesDisplay structure={f.structure} notes={f.notes} locale={locale} />
          </section>

          <section aria-labelledby="variants-heading">
            <h2 id="variants-heading" className="font-display text-2xl text-realm-accent">
              {t("variants")}
            </h2>
            <Suspense fallback={<VariantList variants={f.variants} locale={locale} stock={null} />}>
              <VariantStock fragranceId={f.id} variants={f.variants} locale={locale} />
            </Suspense>
            <p className="mt-3 text-sm text-realm-ink/65">{t("vatIncluded")}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
