// Idempotent seed: safe to run repeatedly against the same database.
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseFlaconParams } from "../src/lib/flacon";
import { parsePalette } from "../src/lib/palette";
import { fragrances, notes, realms } from "./seed-data";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function validate() {
  const noteIds = new Set(notes.map((n) => n.id));
  const realmSlugs = new Set(realms.map((r) => r.slug));
  for (const r of realms) parsePalette(r.palette);
  for (const f of fragrances) {
    const where = `fragrance ${f.slug}`;
    if (!realmSlugs.has(f.realmSlug)) throw new Error(`${where}: unknown realm ${f.realmSlug}`);
    if (!Number.isInteger(f.intensity) || f.intensity < 1 || f.intensity > 5) {
      throw new Error(`${where}: intensity must be 1 to 5`);
    }
    parseFlaconParams(f.flaconParams);
    if (f.variants.length === 0) throw new Error(`${where}: needs at least one variant`);
    for (const v of f.variants) {
      if (!Number.isInteger(v.priceFils) || v.priceFils <= 0) throw new Error(`${where}: bad price on ${v.sku}`);
      if (!Number.isInteger(v.stock) || v.stock < 0) throw new Error(`${where}: bad stock on ${v.sku}`);
    }
    for (const n of f.notes) {
      if (!noteIds.has(n.noteId)) throw new Error(`${where}: unknown note ${n.noteId}`);
      if (![1, 2, 3].includes(n.weight)) throw new Error(`${where}: weight must be 1 to 3`);
      const chordTier = n.tier === "CHORD";
      if (chordTier !== (f.structure === "CHORD")) {
        throw new Error(`${where}: ${f.structure} structure cannot use tier ${n.tier}`);
      }
    }
  }
}

async function main() {
  validate();

  for (const n of notes) {
    await db.note.upsert({ where: { id: n.id }, create: n, update: n });
  }

  const realmIds = new Map<string, string>();
  for (const r of realms) {
    const row = await db.realm.upsert({ where: { slug: r.slug }, create: r, update: r });
    realmIds.set(r.slug, row.id);
  }

  for (const { variants, notes: fNotes, realmSlug, ...f } of fragrances) {
    const data = { ...f, realmId: realmIds.get(realmSlug)! };
    const row = await db.fragrance.upsert({ where: { slug: f.slug }, create: data, update: data });

    for (const v of variants) {
      // Stock is only set on first insert so a reseed never resets live stock.
      await db.variant.upsert({
        where: { sku: v.sku },
        create: { ...v, fragranceId: row.id },
        update: { label: v.label, priceFils: v.priceFils, fragranceId: row.id },
      });
    }

    await db.fragranceNote.deleteMany({ where: { fragranceId: row.id } });
    await db.fragranceNote.createMany({
      data: fNotes.map((n) => ({ ...n, fragranceId: row.id })),
    });
  }

  console.log(`Seeded ${realms.length} realm(s), ${fragrances.length} fragrance(s), ${notes.length} notes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
