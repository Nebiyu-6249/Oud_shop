import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-24 sm:px-10">
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <p className="mt-4">{t("body")}</p>
      <Link href="/" className="mt-8 inline-block text-brass underline underline-offset-4">
        {t("home")}
      </Link>
    </main>
  );
}
