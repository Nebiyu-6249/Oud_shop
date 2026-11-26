// A realm's colour grade. Stored as Realm.palette and applied as CSS variables.

export type Palette = {
  base: string;
  surface: string;
  accent: string;
  ink: string;
  glow: string;
};

const KEYS = ["base", "surface", "accent", "ink", "glow"] as const;
const HEX = /^#[0-9a-fA-F]{6}$/;

export function parsePalette(value: unknown): Palette {
  const v = value as Record<string, unknown> | null;
  if (!v || typeof v !== "object") throw new TypeError("palette must be an object");
  for (const k of KEYS) {
    if (typeof v[k] !== "string" || !HEX.test(v[k] as string)) {
      throw new TypeError(`palette.${k} must be a #rrggbb hex colour`);
    }
  }
  return v as Palette;
}

/** Inline style object that sets the realm grade on a subtree. */
export function paletteStyle(p: Palette): Record<string, string> {
  return {
    "--realm-base": p.base,
    "--realm-surface": p.surface,
    "--realm-accent": p.accent,
    "--realm-ink": p.ink,
    "--realm-glow": p.glow,
  };
}
