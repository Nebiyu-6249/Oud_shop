import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { db } from "./db";
import { parseFlaconParams } from "./flacon";
import { parsePalette } from "./palette";

// Catalogue content changes only on deploy (the seed runs in the build), so it
// is cached. Stock is live and read per request.

export async function getFragranceSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const rows = await db.fragrance.findMany({ select: { slug: true }, orderBy: { slug: "asc" } });
  return rows.map((r) => r.slug);
}

export async function getFragrance(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag("catalog", `fragrance:${slug}`);
  const row = await db.fragrance.findUnique({
    where: { slug },
    include: {
      realm: true,
      variants: {
        select: { id: true, label: true, priceFils: true, sku: true },
        orderBy: { priceFils: "desc" },
      },
      notes: {
        include: { note: true },
        orderBy: [{ weight: "desc" }, { noteId: "asc" }],
      },
    },
  });
  if (!row) return null;
  return {
    ...row,
    flaconParams: parseFlaconParams(row.flaconParams),
    realm: { ...row.realm, palette: parsePalette(row.realm.palette) },
  };
}

export type FragranceDetail = NonNullable<Awaited<ReturnType<typeof getFragrance>>>;

/** Live stock per variant id. Runs at request time inside a serverless function. */
export async function getStock(fragranceId: string): Promise<Record<string, number>> {
  await connection();
  const rows = await db.variant.findMany({
    where: { fragranceId },
    select: { id: true, stock: true },
  });
  return Object.fromEntries(rows.map((r) => [r.id, r.stock]));
}

const cardSelect = {
  id: true,
  slug: true,
  nameEn: true,
  nameAr: true,
  form: true,
  family: true,
  wear: true,
  intensity: true,
  flaconParams: true,
  variants: { select: { priceFils: true } },
} as const;

type CardRow = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  form: FragranceDetail["form"];
  family: FragranceDetail["family"];
  wear: FragranceDetail["wear"];
  intensity: number;
  flaconParams: unknown;
  variants: { priceFils: number }[];
};

const FORM_ORDER = { EXTRAIT: 0, EDP: 0, ATTAR: 1, BAKHOOR: 2 } as const;

function toCard(f: CardRow) {
  return {
    id: f.id,
    slug: f.slug,
    nameEn: f.nameEn,
    nameAr: f.nameAr,
    form: f.form,
    family: f.family,
    wear: f.wear,
    intensity: f.intensity,
    flaconParams: parseFlaconParams(f.flaconParams),
    fromFils: Math.min(...f.variants.map((v) => v.priceFils)),
  };
}

export type FragranceCard = ReturnType<typeof toCard>;

export async function getRealms() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const rows = await db.realm.findMany({
    orderBy: { sortOrder: "asc" },
    include: { fragrances: { select: cardSelect } },
  });
  return rows.map((r) => ({
    ...r,
    palette: parsePalette(r.palette),
    fragrances: r.fragrances.map(toCard).sort((a, b) => FORM_ORDER[a.form] - FORM_ORDER[b.form]),
  }));
}

export type RealmWithFragrances = Awaited<ReturnType<typeof getRealms>>[number];

export async function getRealm(slug: string) {
  const realms = await getRealms();
  return realms.find((r) => r.slug === slug) ?? null;
}

/** Everything the colour grade needs to follow navigation. */
export async function getGradeMap() {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");
  const realms = await getRealms();
  const palettes: Record<string, ReturnType<typeof parsePalette>> = {};
  const fragranceRealm: Record<string, string> = {};
  for (const r of realms) {
    palettes[r.slug] = r.palette;
    for (const f of r.fragrances) fragranceRealm[f.slug] = r.slug;
  }
  return { palettes, fragranceRealm };
}
