import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./locale-switch";

export async function SiteHeader() {
  const t = await getTranslations("Site");
  const locale = await getLocale();
  return (
    <header className="rule flex items-center justify-between border-b px-5 py-4 sm:px-10">
      <Link href="/" className="font-display text-xl tracking-[0.2em] text-realm-accent uppercase">
        {t("name")}
      </Link>
      <nav aria-label={t("nav")} className="flex items-center gap-6">
        <Link href="/finder" className="text-base text-realm-ink/85 underline-offset-4 hover:text-realm-accent hover:underline">
          {t("finder")}
        </Link>
        <LocaleSwitch label={t("switchLocale")} target={locale === "ar" ? "en" : "ar"} />
      </nav>
    </header>
  );
}
