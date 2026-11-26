import "server-only";
import Stripe from "stripe";

export class PaymentsNotConfigured extends Error {
  constructor(name: string) {
    super(`${name} is not set`);
  }
}

let client: Stripe | null = null;

/** The Stripe client, created on first use so builds never need the key. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new PaymentsNotConfigured("STRIPE_SECRET_KEY");
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    // This project only ever takes test payments.
    throw new Error("STRIPE_SECRET_KEY must be a test-mode key");
  }
  client ??= new Stripe(key, { maxNetworkRetries: 2 });
  return client;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new PaymentsNotConfigured("STRIPE_WEBHOOK_SECRET");
  return secret;
}
