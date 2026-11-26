import type { Metadata } from "next";
import { routing } from "./routing";

/** Canonical and hreflang links for a path that exists in every locale. */
export function alternates(locale: string, path = ""): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l === "ar" ? "ar-AE" : "en-AE", `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}
