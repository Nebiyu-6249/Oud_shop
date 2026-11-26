import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import * as rootParams from "next/root-params";
import { Suspense } from "react";
import { CartView } from "@/components/cart/cart-view";
import { getCartCatalog } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Cart");
  return { title: t("title"), robots: { index: false } };
}

export default async function CartPage() {
  const locale = (await rootParams.locale()) === "ar" ? "ar" : "en";
  const [t, messages, catalog] = await Promise.all([getTranslations("Cart"), getMessages(), getCartCatalog()]);
  return (
    <main id="main" className="mx-auto max-w-6xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="font-display mb-10 text-5xl">{t("title")}</h1>
      <NextIntlClientProvider messages={{ Cart: messages.Cart }}>
        <Suspense fallback={<div className="min-h-64" aria-busy />}>
          <CartView catalog={catalog} locale={locale} />
        </Suspense>
      </NextIntlClientProvider>
    </main>
  );
}
