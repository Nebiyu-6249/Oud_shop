// Checkout and fulfilment. Dependencies are passed in so the logic can be
// exercised against a real database with a stand-in for Stripe.

import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import type { PrismaClient } from "@/generated/prisma/client";
import { type CartItem, type LineError, priceCart } from "./cart-pricing";

type Db = PrismaClient;
type SessionsApi = Pick<Stripe.Checkout.SessionResource, "create" | "expire">;

export type CheckoutInput = { items: CartItem[]; email: string; locale: "en" | "ar" };

export type CheckoutOutcome =
  | { ok: true; orderId: string; url: string }
  | { ok: false; status: 409; errors: Record<string, LineError> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (s: unknown): s is string => typeof s === "string" && s.length <= 254 && EMAIL.test(s);

/** Sessions stay open for 30 minutes, the shortest Stripe allows. */
const SESSION_MINUTES = 30;

export async function createCheckout(
  deps: { db: Db; sessions: SessionsApi | (() => SessionsApi); siteUrl: string; now?: () => number },
  input: CheckoutInput,
): Promise<CheckoutOutcome> {
  const { db, siteUrl } = deps;
  const now = deps.now ?? Date.now;

  const rows = await db.variant.findMany({
    where: { id: { in: input.items.map((i) => i.variantId) } },
    select: {
      id: true,
      label: true,
      priceFils: true,
      stock: true,
      sku: true,
      fragrance: { select: { nameEn: true, nameAr: true, slug: true } },
    },
  });
  const cart = priceCart(input.items, rows);
  if (Object.keys(cart.errors).length > 0) return { ok: false, status: 409, errors: cart.errors };

  // Only reach for Stripe once the cart is known to be buyable.
  const sessions = typeof deps.sessions === "function" ? deps.sessions() : deps.sessions;
  const orderId = randomUUID();
  const ar = input.locale === "ar";
  const base = `${siteUrl}/${input.locale}`;

  const session = await sessions.create(
    {
      mode: "payment",
      currency: "aed",
      customer_email: input.email,
      client_reference_id: orderId,
      metadata: { orderId },
      locale: ar ? "auto" : "en",
      expires_at: Math.floor(now() / 1000) + SESSION_MINUTES * 60,
      line_items: cart.lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: "aed",
          // Prices are VAT-inclusive; AED's minor unit is the fils.
          unit_amount: l.unitPriceFils,
          tax_behavior: "inclusive",
          product_data: {
            name: `${ar ? l.variant.fragrance.nameAr : l.variant.fragrance.nameEn}, ${l.variant.label}`,
            metadata: { sku: l.variant.sku, variantId: l.variant.id },
          },
        },
      })),
      custom_text: {
        submit: {
          message: ar ? "الأسعار شاملة ضريبة القيمة المضافة 5%." : "Prices include 5% VAT.",
        },
      },
      success_url: `${base}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart?cancelled=1`,
    },
    { idempotencyKey: `checkout-${orderId}` },
  );

  try {
    await db.order.create({
      data: {
        id: orderId,
        email: input.email,
        locale: input.locale,
        status: "PENDING",
        totalFils: cart.totalFils,
        vatFils: cart.vatFils,
        stripeSessionId: session.id,
        items: {
          create: cart.lines.map((l) => ({ variantId: l.variant.id, qty: l.qty, unitPriceFils: l.unitPriceFils })),
        },
      },
    });
  } catch (err) {
    // Never leave a payable session without an order behind it.
    await sessions.expire(session.id).catch(() => undefined);
    throw err;
  }

  if (!session.url) throw new Error("Stripe returned a session without a URL");
  return { ok: true, orderId, url: session.url };
}

export type FulfilResult = "paid" | "already" | "unknown";

/**
 * Marks the order for a completed session PAID and takes the stock, exactly
 * once: the status flip is conditional on PENDING inside one transaction, so
 * a retried or duplicated webhook finds nothing to do.
 */
export async function markPaid(db: Db, sessionId: string, email?: string | null): Promise<FulfilResult> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { stripeSessionId: sessionId },
      select: { id: true, items: { select: { variantId: true, qty: true } } },
    });
    if (!order) return "unknown";
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["PENDING", "CANCELLED"] } },
      data: { status: "PAID", ...(email ? { email } : {}) },
    });
    if (flipped.count === 0) return "already";
    for (const item of order.items) {
      const taken = await tx.variant.updateMany({
        where: { id: item.variantId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (taken.count === 0) {
        // Paid for more than is left (two buyers raced). Keep the payment,
        // floor the stock and leave a trace for a human to follow up.
        await tx.variant.update({ where: { id: item.variantId }, data: { stock: 0 } });
        console.warn(`oversold variant ${item.variantId} on order ${order.id}`);
      }
    }
    return "paid";
  });
}

/** An abandoned session: the order is cancelled unless it was already paid. */
export async function markCancelled(db: Db, sessionId: string): Promise<boolean> {
  const r = await db.order.updateMany({
    where: { stripeSessionId: sessionId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  return r.count > 0;
}
