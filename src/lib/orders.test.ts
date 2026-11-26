// Integration tests: these run against the DATABASE_URL in .env.local and are
// skipped when it is not set. Stripe is replaced by an in-memory stand-in.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { createCheckout, markCancelled, markPaid } from "./orders";

const url = process.env.DATABASE_URL;
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : (null as unknown as PrismaClient);

const SLUG = "test-only-fragrance";
let variantA = "";
let variantB = "";

function fakeSessions() {
  const created: Stripe.Checkout.SessionCreateParams[] = [];
  const expired: string[] = [];
  let n = 0;
  return {
    created,
    expired,
    api: {
      create: async (params: Stripe.Checkout.SessionCreateParams) => {
        created.push(params);
        n += 1;
        return { id: `cs_test_fake_${Date.now()}_${n}`, url: `https://checkout.stripe.test/${n}` } as Stripe.Checkout.Session;
      },
      expire: async (id: string) => {
        expired.push(id);
        return { id } as Stripe.Checkout.Session;
      },
    } as unknown as Pick<Stripe.Checkout.SessionResource, "create" | "expire">,
  };
}

async function cleanup() {
  const variants = await db.variant.findMany({ where: { fragrance: { slug: SLUG } }, select: { id: true } });
  const ids = variants.map((v) => v.id);
  await db.order.deleteMany({ where: { items: { some: { variantId: { in: ids } } } } });
  await db.fragrance.deleteMany({ where: { slug: SLUG } });
}

describe.skipIf(!url)("orders (database)", () => {
  beforeAll(async () => {
    await cleanup();
    const realm = await db.realm.findFirstOrThrow();
    const f = await db.fragrance.create({
      data: {
        slug: SLUG,
        nameEn: "Test Only",
        nameAr: "اختبار",
        realmId: realm.id,
        family: "WOODY",
        subfamily: "oud",
        form: "EDP",
        structure: "PYRAMID",
        intensity: 3,
        wear: "BOTH",
        storyEn: "test",
        storyAr: "test",
        flaconParams: {},
        variants: {
          create: [
            { label: "50 ml", priceFils: 650_00, sku: "TEST-ONLY-A", stock: 5 },
            { label: "3 ml", priceFils: 145_00, sku: "TEST-ONLY-B", stock: 1 },
          ],
        },
      },
      include: { variants: true },
    });
    variantA = f.variants.find((v) => v.sku === "TEST-ONLY-A")!.id;
    variantB = f.variants.find((v) => v.sku === "TEST-ONLY-B")!.id;
  });

  beforeEach(async () => {
    await db.variant.update({ where: { id: variantA }, data: { stock: 5 } });
    await db.variant.update({ where: { id: variantB }, data: { stock: 1 } });
  });

  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it("creates a pending order and a session priced from the database", async () => {
    const s = fakeSessions();
    const out = await createCheckout(
      { db, sessions: s.api, siteUrl: "https://shop.test" },
      { items: [{ variantId: variantA, qty: 2 }, { variantId: variantB, qty: 1 }], email: "buyer@example.com", locale: "en" },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const order = await db.order.findUniqueOrThrow({ where: { id: out.orderId }, include: { items: true } });
    expect(order.status).toBe("PENDING");
    expect(order.totalFils).toBe(1_445_00);
    expect(order.vatFils).toBe(Math.round((1_445_00 * 5) / 105));
    expect(order.items).toHaveLength(2);

    const params = s.created[0];
    expect(params.currency).toBe("aed");
    expect(params.line_items?.map((l) => l.price_data?.unit_amount)).toEqual([650_00, 145_00]);
    expect(params.success_url).toBe(`https://shop.test/en/order/${out.orderId}?session_id={CHECKOUT_SESSION_ID}`);
    expect(params.cancel_url).toBe("https://shop.test/en/cart?cancelled=1");
  });

  it("refuses short stock per line, without touching Stripe", async () => {
    const s = fakeSessions();
    const out = await createCheckout(
      { db, sessions: s.api, siteUrl: "https://shop.test" },
      { items: [{ variantId: variantA, qty: 1 }, { variantId: variantB, qty: 2 }], email: "buyer@example.com", locale: "en" },
    );
    expect(out).toEqual({ ok: false, status: 409, errors: { [variantB]: { code: "SHORT_STOCK", available: 1 } } });
    expect(s.created).toHaveLength(0);
  });

  it("marks paid and takes stock exactly once", async () => {
    const s = fakeSessions();
    const out = await createCheckout(
      { db, sessions: s.api, siteUrl: "https://shop.test" },
      { items: [{ variantId: variantA, qty: 2 }], email: "buyer@example.com", locale: "ar" },
    );
    if (!out.ok) throw new Error("checkout failed");
    const { stripeSessionId } = await db.order.findUniqueOrThrow({ where: { id: out.orderId } });

    const results = await Promise.all([markPaid(db, stripeSessionId), markPaid(db, stripeSessionId)]);
    expect(results.sort()).toEqual(["already", "paid"]);
    expect(await markPaid(db, stripeSessionId)).toBe("already");
    expect((await db.variant.findUniqueOrThrow({ where: { id: variantA } })).stock).toBe(3);
    expect((await db.order.findUniqueOrThrow({ where: { id: out.orderId } })).status).toBe("PAID");
  });

  it("cancels an expired session but never a paid one", async () => {
    const s = fakeSessions();
    const one = await createCheckout({ db, sessions: s.api, siteUrl: "https://shop.test" }, { items: [{ variantId: variantA, qty: 1 }], email: "a@b.co", locale: "en" });
    const two = await createCheckout({ db, sessions: s.api, siteUrl: "https://shop.test" }, { items: [{ variantId: variantA, qty: 1 }], email: "a@b.co", locale: "en" });
    if (!one.ok || !two.ok) throw new Error("checkout failed");
    const [o1, o2] = await Promise.all([one, two].map((o) => db.order.findUniqueOrThrow({ where: { id: o.orderId } })));
    await markPaid(db, o2.stripeSessionId);
    expect(await markCancelled(db, o1.stripeSessionId)).toBe(true);
    expect(await markCancelled(db, o2.stripeSessionId)).toBe(false);
    expect((await db.order.findUniqueOrThrow({ where: { id: o2.id } })).status).toBe("PAID");
  });

  it("returns unknown for a session it never created", async () => {
    expect(await markPaid(db, "cs_test_nobody")).toBe("unknown");
  });

  it("webhook route: rejects a bad signature, fulfils a signed event once", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_only";
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const s = fakeSessions();
    const out = await createCheckout({ db, sessions: s.api, siteUrl: "https://shop.test" }, { items: [{ variantId: variantB, qty: 1 }], email: "a@b.co", locale: "en" });
    if (!out.ok) throw new Error("checkout failed");
    const { stripeSessionId } = await db.order.findUniqueOrThrow({ where: { id: out.orderId } });

    const payload = JSON.stringify({
      id: "evt_test_1",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: stripeSessionId, object: "checkout.session", payment_status: "paid", customer_details: { email: "paid@example.com" } } },
    });
    const send = (signature: string) =>
      POST(new Request("https://shop.test/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));

    expect((await send("t=1,v1=nonsense")).status).toBe(400);
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_only" });
    expect((await send(header)).status).toBe(200);
    expect((await send(header)).status).toBe(200);

    const order = await db.order.findUniqueOrThrow({ where: { id: out.orderId } });
    expect(order.status).toBe("PAID");
    expect(order.email).toBe("paid@example.com");
    expect((await db.variant.findUniqueOrThrow({ where: { id: variantB } })).stock).toBe(0);
  });
});
