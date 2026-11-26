"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "./store";

/** Header link to the cart with a live item count. */
export function CartLink() {
  const t = useTranslations("Site");
  const lines = useCart();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Link
      href="/cart"
      aria-label={t("cartCount", { count })}
      className="flex items-center gap-2 text-base text-realm-ink/85 underline-offset-4 hover:text-realm-accent hover:underline"
    >
      {t("cart")}
      {count > 0 && (
        <span aria-hidden className="font-display min-w-6 border border-realm-accent px-1.5 text-center text-sm text-realm-accent tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
