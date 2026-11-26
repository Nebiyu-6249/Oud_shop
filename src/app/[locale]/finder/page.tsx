import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Finder } from "@/components/astrolabe/finder";
import { getFinderData } from "@/lib/finder-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Finder");
  return { title: t("title"), description: t("intro") };
}

export default async function FinderPage() {
  const locale = await rootParams.locale();
  const [t, messages, data] = await Promise.all([getTranslations("Finder"), getMessages(), getFinderData(locale)]);

  return (
    <main id="main" className="mx-auto max-w-7xl px-5 py-12 sm:px-10 sm:py-16">
      <header className="max-w-3xl">
        <h1 className="font-display text-5xl leading-tight sm:text-6xl">{t("title")}</h1>
        <p className="mt-5 text-xl leading-relaxed text-realm-ink/85">{t("intro")}</p>
      </header>
      <div className="mt-12">
        <NextIntlClientProvider messages={{ Finder: messages.Finder }}>
          <Finder fragrances={data.fragrances} labels={data.labels} locale={locale} />
        </NextIntlClientProvider>
      </div>
    </main>
  );
}
