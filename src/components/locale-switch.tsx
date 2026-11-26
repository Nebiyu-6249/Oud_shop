"use client";

import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitch({ label, target }: { label: string; target: "en" | "ar" }) {
  const pathname = usePathname();
  return (
    <Link
      href={pathname}
      locale={target}
      lang={target}
      className="text-base text-realm-ink/80 underline-offset-4 hover:text-realm-accent hover:underline"
    >
      {label}
    </Link>
  );
}
