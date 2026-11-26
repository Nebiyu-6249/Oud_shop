"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { type Palette, paletteStyle } from "@/lib/palette";

/**
 * Applies the current realm's colour grade to everything below it. The
 * element persists across navigation, and the --realm-* properties are
 * registered as colours in globals.css, so a change of realm transitions
 * the grade instead of cutting to it.
 */
export function Grade({
  palettes,
  fragranceRealm,
  children,
}: {
  palettes: Record<string, Palette>;
  fragranceRealm: Record<string, string>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [, section, slug] = pathname.split("/");
  const realm =
    section === "realms" ? slug : section === "fragrance" ? fragranceRealm[slug] : undefined;
  const palette = realm ? palettes[realm] : undefined;

  return (
    <div
      className="grade relative z-[1] flex min-h-dvh flex-col"
      data-realm={realm ?? "house"}
      data-home={pathname === "/" ? "" : undefined}
      style={palette ? (paletteStyle(palette) as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
