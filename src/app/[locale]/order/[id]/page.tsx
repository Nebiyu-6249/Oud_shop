import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import * as rootParams from "next/root-params";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { OrderStatus } from "@/components/cart/order-status";
import { db } from "@/lib/db";
import { formatAED, lineTotal } from "@/lib/money";
import { formatVariantLabel } from "@/lib/units";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Orders are never prerendered. One placeholder id lets the build check the
 * route's shell (the layout reads the pathname); real ids render on request.
 */
export function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Order");
  return { title: t("title"), robots: { index: false } };
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}${"*".repeat(Math.max(1, Math.min(6, user.length - 1)))}@${domain}`;
}

async function OrderDetails({ id }: { id: string }) {
  await connection();
  if (!UUID.test(id)) notFound();
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { variant: { select: { label: true, fragrance: { select: { nameEn: true, nameAr: true, slug: true } } } } },
      },
    },
  });
  if (!order) notFound();

  const locale = await rootParams.locale();
  const ar = locale === "ar";
  const t = await getTranslations("Order");
  const copy = {
    confirming: { title: t("confirming"), body: t("confirmingBody") },
    paid: { title: t("paid"), body: t("paidBody", { email: maskEmail(order.email) }) },
    pendingLong: { title: t("pendingLong"), body: t("pendingLongBody") },
    cancelled: { title: t("cancelled"), body: t("cancelledBody") },
  };

  return (
    <>
      <p className="mb-6 text-base text-realm-ink/65">
        {/* isolate the Latin id so it reads correctly inside Arabic text */}
        {t("number", { id: `\u2066${order.id.slice(0, 8).toUpperCase()}\u2069` })}
      </p>
      <OrderStatus status={order.status} copy={copy} />

      <h2 className="font-display mt-10 text-2xl text-realm-accent">{t("items")}</h2>
      <ul className="mt-4">
        {order.items.map((item) => (
          <li key={item.id} className="rule flex items-baseline justify-between gap-4 border-t py-3 last:border-b">
            <span>
              <Link href={`/fragrance/${item.variant.fragrance.slug}`} className="font-display text-lg hover:text-realm-accent">
                {ar ? item.variant.fragrance.nameAr : item.variant.fragrance.nameEn}
              </Link>
              <span className="block text-base text-realm-ink/70">
                {formatVariantLabel(item.variant.label, locale)}, {item.qty} &times; {formatAED(item.unitPriceFils, locale)}
              </span>
            </span>
            <span className="font-display text-lg tabular-nums">
              {formatAED(lineTotal(item.unitPriceFils, item.qty), locale)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-6">
        <div className="flex items-baseline justify-between">
          <dt className="font-display text-xl">{order.status === "PAID" ? t("total") : t("totalDue")}</dt>
          <dd className="font-display text-2xl tabular-nums">{formatAED(order.totalFils, locale)}</dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-base text-realm-ink/75">
          <dt>{t("vat")}</dt>
          <dd className="tabular-nums">{formatAED(order.vatFils, locale)}</dd>
        </div>
      </dl>
    </>
  );
}

export default async function OrderPage({ params }: PageProps<"/[locale]/order/[id]">) {
  const t = await getTranslations("Order");
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12 sm:px-10 sm:py-16">
      <h1 className="font-display mb-8 text-5xl">{t("title")}</h1>
      <Suspense fallback={<div className="min-h-64" aria-busy />}>
        {params.then(({ id }) => (
          <OrderDetails id={id} />
        ))}
      </Suspense>
      <Link href="/" className="mt-12 inline-block text-realm-accent underline underline-offset-4">
        {t("continue")}
      </Link>
    </main>
  );
}
