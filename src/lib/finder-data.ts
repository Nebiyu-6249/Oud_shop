import "server-only";
import { getTranslations } from "next-intl/server";
import type { AstrolabeLabels } from "@/components/astrolabe/model";
import type { FinderFragrance } from "@/components/astrolabe/finder";
import { getRealms } from "./catalog";
import { WHEEL } from "./finder";

const ROMAN = ["I", "II", "III", "IV", "V"];
/** On Arabic instruments numbers were engraved as abjad letters. */
const ABJAD = ["ا", "ب", "ج", "د", "ه"];

export async function getFinderData(locale: string) {
  const [realms, tFamily, tForm, tFinder] = await Promise.all([
    getRealms(),
    getTranslations("Family"),
    getTranslations("Form"),
    getTranslations("Finder"),
  ]);
  const ar = locale === "ar";
  let mark = 0;
  const fragrances: FinderFragrance[] = [];
  for (const r of realms) {
    for (const f of r.fragrances) {
      fragrances.push({
        slug: f.slug,
        family: f.family,
        wear: f.wear,
        intensity: f.intensity,
        realmSlug: r.slug,
        name: ar ? f.nameAr : f.nameEn,
        realmName: ar ? r.nameAr : r.nameEn,
        formLabel: tForm(f.form),
        fromFils: f.fromFils,
        flaconParams: f.flaconParams,
        mark: mark++,
      });
    }
  }
  const labels: AstrolabeLabels = {
    families: WHEEL.map((f) => tFamily(f)),
    wear: [tFinder("wearDay"), tFinder("wearAny"), tFinder("wearNight")],
    wearSymbols: ["day", "any", "night"],
    intensities: ar ? ABJAD : ROMAN,
  };
  return { fragrances, labels };
}
