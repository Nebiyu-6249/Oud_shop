import type { Metadata } from "next";
import { Amiri, Cinzel, EB_Garamond, Reem_Kufi } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { directionOf, routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { Grade } from "@/components/realm/grade";
import { getGradeMap } from "@/lib/catalog";
import { MotionLayer } from "@/components/motion/motion-layer";
import { StageHost } from "@/components/stage/stage-host";
import "../globals.css";

/** The public origin: set explicitly, or the production domain Vercel provides. */
function siteUrl(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? new URL(`https://${vercel}`) : undefined;
}

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", display: "swap" });
const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  variable: "--font-reem-kufi",
  display: "swap",
  preload: false,
});
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Site");
  return {
    title: { default: t("name"), template: `%s | ${t("name")}` },
    description: t("tagline"),
    metadataBase: siteUrl(),
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootParams.locale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("Site");
  const tFamily = await getTranslations("Family");
  const grade = await getGradeMap();

  return (
    <html
      lang={locale}
      dir={directionOf(locale)}
      className={`${cinzel.variable} ${garamond.variable} ${reemKufi.variable} ${amiri.variable} antialiased`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:bg-night focus:px-3 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        {/* Client components get only the messages they need; none yet. */}
        <NextIntlClientProvider messages={{}}>
          {/* the persistent 3D stage: fixed behind everything, never remounted */}
          <StageHost
            familyLabels={[tFamily("FLORAL"), tFamily("AMBER"), tFamily("WOODY"), tFamily("FRESH")]}
            realmPalettes={grade.palettes}
          />
          <Grade palettes={grade.palettes} fragranceRealm={grade.fragranceRealm}>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <MotionLayer />
          </Grade>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
