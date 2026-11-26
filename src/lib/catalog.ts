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
        orderBy: [{ weight: "desc" }],
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
