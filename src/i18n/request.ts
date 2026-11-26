import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // An explicit locale (e.g. getTranslations({ locale })) wins; otherwise
  // read the [locale] root segment.
  const candidate = locale ?? (await rootParams.locale());
  const resolved = hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
  };
});
