import { db } from "@/lib/db";
import { normaliseItems } from "@/lib/cart-pricing";
import { createCheckout, isEmail } from "@/lib/orders";
import { PaymentsNotConfigured, getStripe } from "@/lib/stripe";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "BAD_REQUEST" }, 400);
  }
  const items = normaliseItems(body.items);
  const locale = body.locale === "ar" ? "ar" : body.locale === "en" ? "en" : null;
  if (!items || !locale) return json({ error: "BAD_REQUEST" }, 400);
  if (!isEmail(body.email)) return json({ error: "BAD_EMAIL" }, 400);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");

  try {
    const outcome = await createCheckout(
      { db, sessions: () => getStripe().checkout.sessions, siteUrl },
      { items, email: body.email, locale },
    );
    if (!outcome.ok) return json({ errors: outcome.errors }, outcome.status);
    return json({ url: outcome.url, orderId: outcome.orderId });
  } catch (err) {
    if (err instanceof PaymentsNotConfigured) return json({ error: "PAYMENTS_UNAVAILABLE" }, 503);
    console.error("checkout failed", err);
    return json({ error: "CHECKOUT_FAILED" }, 502);
  }
}
