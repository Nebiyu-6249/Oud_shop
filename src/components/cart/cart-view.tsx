"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { Flacon } from "@/components/flacon/flacon";
import type { CartCatalogEntry } from "@/lib/catalog";
import { formatAED, lineTotal, vatFromInclusive } from "@/lib/money";
import { formatVariantLabel } from "@/lib/units";
import { joinList } from "@/lib/text";
import { CART_MAX_QTY, cart, useCart } from "./store";

type LineError = { code: "NOT_FOUND" } | { code: "SHORT_STOCK"; available: number } | { code: "BAD_QTY" };
type FormError = "badEmail" | "unavailable" | "failed" | "fixLines" | null;

const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

export function CartView({ catalog, locale }: { catalog: CartCatalogEntry[]; locale: "en" | "ar" }) {
  const t = useTranslations("Cart");
  const hydrated = useHydrated();
  const lines = useCart();
  const cancelled = useSearchParams().get("cancelled") === "1";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<FormError>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, LineError>>({});

  if (!hydrated) return <div className="min-h-64" aria-busy />;

  const byId = new Map(catalog.map((c) => [c.id, c]));
  const rows = lines.map((l) => ({ line: l, item: byId.get(l.variantId) }));
  const total = rows.reduce((s, r) => s + (r.item ? lineTotal(r.item.priceFils, r.line.qty) : 0), 0);
  const ar = locale === "ar";

  const clearError = (id: string) =>
    setLineErrors((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (rows.some((r) => !r.item)) {
      setFormError("fixLines");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines, email, locale }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      if (res.status === 409 && body.errors) {
        setLineErrors(body.errors);
        setFormError("fixLines");
      } else if (body.error === "BAD_EMAIL") setFormError("badEmail");
      else if (res.status === 503) setFormError("unavailable");
      else setFormError("failed");
    } catch {
      setFormError("failed");
    }
    setBusy(false);
  }

  const errorText = (err: LineError) =>
    err.code === "SHORT_STOCK" ? t("shortStock", { available: err.available }) : err.code === "NOT_FOUND" ? t("notFound") : t("badQty");

  return (
    <div>
      {cancelled && (
        <p role="status" className="rule mb-8 border-s-2 ps-4 text-lg">
          {t("cancelled")}
        </p>
      )}

      {lines.length === 0 ? (
        <div className="py-10">
          <p className="text-xl">{t("empty")}</p>
          <Link href="/finder" className="mt-4 inline-block text-realm-accent underline underline-offset-4">
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-12 lg:grid-cols-[1.4fr_1fr]" noValidate>
          <ul>
            {rows.map(({ line, item }) => {
              const err = lineErrors[line.variantId] ?? (item ? undefined : ({ code: "NOT_FOUND" } as const));
              const name = item ? (ar ? item.nameAr : item.nameEn) : "";
              return (
                <li key={line.variantId} className="rule border-t py-5 last:border-b">
                  <div className="grid grid-cols-[4rem_1fr_auto] items-start gap-4">
                    {item ? (
                      <Flacon params={item.flaconParams} id={`cart-${line.variantId}`} label="" className="h-20 w-auto text-realm-accent" />
                    ) : (
                      <span />
                    )}
                    <div>
                      {item && (
                        <Link href={`/fragrance/${item.slug}`} className="font-display text-xl hover:text-realm-accent">
                          {name}
                        </Link>
                      )}
                      {item && (
                        <p className="text-base text-realm-ink/70">
                          {joinList([formatVariantLabel(item.label, locale), formatAED(item.priceFils, locale)], locale)}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="rule flex items-center border" role="group" aria-label={`${t("quantity")}, ${name}`}>
                          <button
                            type="button"
                            aria-label={t("decrease")}
                            onClick={() => {
                              cart.setQty(line.variantId, line.qty - 1);
                              clearError(line.variantId);
                            }}
                            className="h-10 w-10 text-lg"
                          >
                            -
                          </button>
                          <output aria-live="polite" className="w-8 text-center tabular-nums">
                            {line.qty}
                          </output>
                          <button
                            type="button"
                            aria-label={t("increase")}
                            disabled={line.qty >= CART_MAX_QTY}
                            onClick={() => {
                              cart.setQty(line.variantId, line.qty + 1);
                              clearError(line.variantId);
                            }}
                            className="h-10 w-10 text-lg disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            cart.remove(line.variantId);
                            clearError(line.variantId);
                          }}
                          className="text-base text-realm-ink/70 underline underline-offset-4 hover:text-realm-accent"
                        >
                          {t("remove")}
                        </button>
                      </div>
                      {err && (
                        <p className="mt-2 text-base text-[#e58a6f]" role="alert">
                          {errorText(err)}
                        </p>
                      )}
                    </div>
                    <span className="font-display text-lg tabular-nums">
                      {item ? formatAED(lineTotal(item.priceFils, line.qty), locale) : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div>
            <dl className="rule border-y py-4">
              <div className="flex items-baseline justify-between">
                <dt className="font-display text-xl">{t("total")}</dt>
                <dd className="font-display text-2xl tabular-nums">{formatAED(total, locale)}</dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-base text-realm-ink/75">
                <dt>{t("vat")}</dt>
                <dd className="tabular-nums">{formatAED(vatFromInclusive(total), locale)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-realm-ink/60">{t("vatNote")}</p>

            <label className="mt-8 block">
              <span className="block text-base">{t("email")}</span>
              <input
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={formError === "badEmail"}
                aria-describedby={formError === "badEmail" ? "email-error" : undefined}
                className="rule mt-2 h-12 w-full border bg-transparent px-3 text-lg"
              />
            </label>
            {formError === "badEmail" && (
              <p id="email-error" className="mt-2 text-base text-[#e58a6f]">
                {t("badEmail")}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="font-display mt-6 h-12 w-full border border-realm-accent bg-realm-accent text-lg tracking-[0.08em] text-realm-base transition-colors duration-500 hover:bg-transparent hover:text-realm-accent disabled:opacity-60"
            >
              {busy ? t("redirecting") : t("checkout")}
            </button>
            {formError && formError !== "badEmail" && (
              <p role="alert" className="mt-3 text-base text-[#e58a6f]">
                {t(formError)}
              </p>
            )}
            <p className="mt-6 text-sm text-realm-ink/60">{t("testMode")}</p>
          </div>
        </form>
      )}
    </div>
  );
}
