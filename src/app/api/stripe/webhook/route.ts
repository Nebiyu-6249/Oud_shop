import Stripe from "stripe";
import { db } from "@/lib/db";
import { markCancelled, markPaid } from "@/lib/orders";
import { PaymentsNotConfigured, getWebhookSecret } from "@/lib/stripe";

/**
 * Stripe calls this for checkout events. The signature is checked against
 * the raw body before anything is read from it. Every branch is idempotent,
 * so Stripe's retries and duplicate deliveries are harmless.
 */
export async function POST(request: Request) {
  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (err) {
    if (err instanceof PaymentsNotConfigured) return new Response("webhook not configured", { status: 503 });
    throw err;
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await Stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        const result = await markPaid(db, session.id, session.customer_details?.email);
        if (result === "unknown") console.warn(`webhook for unknown session ${session.id}`);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await markCancelled(db, event.data.object.id);
      break;
    default:
      break;
  }
  return Response.json({ received: true });
}
