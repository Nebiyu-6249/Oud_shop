"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cart } from "./store";

type Status = "PENDING" | "PAID" | "CANCELLED";
type Copy = { title: string; body: string };

const POLL_MS = 2000;
const GIVE_UP_MS = 20000;

/**
 * Shows where the order stands. While it is PENDING the page is re-rendered
 * from the database every two seconds (router.refresh re-reads the Order on
 * the server); after 20 seconds it stops and says the payment is received
 * but not yet confirmed.
 */
export function OrderStatus({
  status,
  copy,
}: {
  status: Status;
  copy: Record<"confirming" | "paid" | "pendingLong" | "cancelled", Copy>;
}) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  const started = useRef<number | null>(null);

  // Arriving back from Stripe: the cart has been bought, so empty it.
  useEffect(() => {
    if (status !== "CANCELLED" && new URLSearchParams(window.location.search).has("session_id")) cart.clear();
  }, [status]);

  useEffect(() => {
    if (status !== "PENDING" || gaveUp) return;
    started.current ??= Date.now();
    const id = setInterval(() => {
      if (Date.now() - (started.current ?? 0) >= GIVE_UP_MS) {
        setGaveUp(true);
        clearInterval(id);
      } else {
        router.refresh();
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [status, gaveUp, router]);

  const c =
    status === "PAID" ? copy.paid : status === "CANCELLED" ? copy.cancelled : gaveUp ? copy.pendingLong : copy.confirming;
  const waiting = status === "PENDING" && !gaveUp;

  return (
    <div role="status" aria-live="polite" aria-busy={waiting} className="rule border-y py-6">
      <p className="font-display flex items-center gap-3 text-3xl text-realm-accent">
        {waiting && <span aria-hidden className="inline-block h-3 w-3 animate-pulse rounded-full bg-realm-accent" />}
        {c.title}
      </p>
      <p className="mt-2 text-lg text-realm-ink/85">{c.body}</p>
    </div>
  );
}
