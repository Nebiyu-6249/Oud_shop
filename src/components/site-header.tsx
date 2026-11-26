import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./locale-switch";
import { CartLink } from "./cart/cart-link";

export async function SiteHeader() {
  const t = await getTranslations("Site");
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <header className="rule flex items-center justify-between border-b px-5 py-4 sm:px-10">
      <Link href="/" className="font-display text-xl tracking-[0.2em] text-realm-accent uppercase">
        {t("name")}
      </Link>
      <nav aria-label={t("nav")} className="flex items-center gap-4 sm:gap-6">
        <Link href="/finder" className="text-base text-realm-ink/85 underline-offset-4 hover:text-realm-accent hover:underline">
          {t("finder")}
        </Link>
        <NextIntlClientProvider messages={{ Site: { cart: t("cart"), cartCount: messages.Site.cartCount } }}>
          <CartLink />
        </NextIntlClientProvider>
        <LocaleSwitch label={t("switchLocale")} target={locale === "ar" ? "en" : "ar"} />
      </nav>
    </header>
  );
}
