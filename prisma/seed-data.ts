// Catalogue content. Phase 1: one realm, two fragrances.
// Arabic copy here is a draft pending native-speaker review (see messages/ar.json).

import type { FlaconParams } from "../src/lib/flacon";
import type { Palette } from "../src/lib/palette";

type Family = "FLORAL" | "AMBER" | "WOODY" | "FRESH";
type Form = "EDP" | "EXTRAIT" | "ATTAR" | "BAKHOOR";
type Structure = "PYRAMID" | "CHORD";
type Wear = "DAY" | "NIGHT" | "BOTH";
type Tier = "TOP" | "HEART" | "BASE" | "CHORD";

export type SeedNote = { id: string; nameEn: string; nameAr: string; ornamentKey: string };

export type SeedRealm = {
  slug: string;
  nameEn: string;
  nameAr: string;
  storyEn: string;
  storyAr: string;
  palette: Palette;
  sortOrder: number;
};

export type SeedFragrance = {
  slug: string;
  nameEn: string;
  nameAr: string;
  realmSlug: string;
  family: Family;
  subfamily: string;
  form: Form;
  structure: Structure;
  intensity: number;
  wear: Wear;
  storyEn: string;
  storyAr: string;
  flaconParams: FlaconParams;
  variants: { label: string; priceFils: number; sku: string; stock: number }[];
  notes: { noteId: string; tier: Tier; weight: number }[];
};

export const notes: SeedNote[] = [
  { id: "note-saffron", nameEn: "Saffron", nameAr: "زعفران", ornamentKey: "saffron-crocus" },
  { id: "note-pink-pepper", nameEn: "Pink peppercorn", nameAr: "فلفل وردي", ornamentKey: "pink-pepper" },
  { id: "note-taif-rose", nameEn: "Taif rose", nameAr: "ورد طائفي", ornamentKey: "rose" },
  { id: "note-agarwood", nameEn: "Agarwood", nameAr: "عود", ornamentKey: "agarwood" },
  { id: "note-labdanum", nameEn: "Labdanum", nameAr: "لادن", ornamentKey: "cistus" },
  { id: "note-sandalwood", nameEn: "Sandalwood", nameAr: "صندل", ornamentKey: "sandalwood" },
];

export const realms: SeedRealm[] = [
  {
    slug: "ember-kiln",
    nameEn: "The Ember Kiln",
    nameAr: "أتون الجمر",
    storyEn:
      "Agarwood is the heartwood a tree makes when it is wounded and survives. The Kiln is where that wood meets the coal: a low room of blackened brick, its air gold with saffron and slow with smoke. Its perfumes are dense and warm, and made for the evening.",
    storyAr:
      "العود هو قلب الشجرة الذي تصنعه حين تُجرح فتنجو. وفي الأتون يلتقي هذا الخشب بالجمر: غرفة منخفضة من آجرّ مسودّ، هواؤها ذهبي بالزعفران وثقيل بالدخان. عطورها كثيفة دافئة، صُنعت للمساء.",
    palette: {
      base: "#0B0807",
      surface: "#1A1210",
      accent: "#C9A24A",
      ink: "#EFE3CB",
      glow: "#9E2A1C",
    },
    sortOrder: 3,
  },
];

export const fragrances: SeedFragrance[] = [
  {
    slug: "ninth-ember",
    nameEn: "Ninth Ember",
    nameAr: "الجمرة التاسعة",
    realmSlug: "ember-kiln",
    family: "WOODY",
    subfamily: "Oud",
    form: "EXTRAIT",
    structure: "PYRAMID",
    intensity: 5,
    wear: "NIGHT",
    storyEn:
      "Nine coals are laid under the censer before the oud goes on. By the ninth, the room has stopped talking. Saffron opens it, red and metallic; Taif rose softens the middle; then the agarwood arrives, resinous and animal, and stays on wool until morning.",
    storyAr:
      "تُرصّ تسع جمرات تحت المبخرة قبل أن يوضع العود. وعند التاسعة يكون المجلس قد سكت. يفتتحه الزعفران أحمر معدنيًا، ويليّن الورد الطائفي وسطه، ثم يحلّ العود راتنجيًا حيوانيًا، ويبقى على الصوف حتى الصباح.",
    flaconParams: {
      silhouette: "flask",
      aspect: 0.72,
      shoulder: 0.35,
      neck: 0.12,
      stopper: "faceted",
      engraving: "kufic-band",
      ornament: "agarwood",
    },
    variants: [
      { label: "50 ml", priceFils: 1_150_00, sku: "AST-NE-EX-050", stock: 14 },
      { label: "100 ml", priceFils: 1_890_00, sku: "AST-NE-EX-100", stock: 3 },
    ],
    notes: [
      { noteId: "note-saffron", tier: "TOP", weight: 3 },
      { noteId: "note-pink-pepper", tier: "TOP", weight: 1 },
      { noteId: "note-taif-rose", tier: "HEART", weight: 2 },
      { noteId: "note-agarwood", tier: "BASE", weight: 3 },
      { noteId: "note-labdanum", tier: "BASE", weight: 2 },
    ],
  },
  {
    slug: "saffron-thread",
    nameEn: "Saffron Thread",
    nameAr: "خيط الزعفران",
    realmSlug: "ember-kiln",
    family: "AMBER",
    subfamily: "Spiced amber",
    form: "ATTAR",
    structure: "CHORD",
    intensity: 4,
    wear: "BOTH",
    storyEn:
      "Attars are distilled into sandalwood oil, not alcohol, so nothing lifts off first and nothing is left alone at the end. This one is a single held chord: saffron threads steeped until the oil turns the colour of brick, a little oud beneath, rose at the edges. Laid on the wrist with the glass rod, it lasts the day.",
    storyAr:
      "تُقطَّر العطور الزيتية في زيت الصندل لا في الكحول، فلا شيء يتطاير أولًا ولا شيء يبقى وحيدًا في الآخر. هذا العطر وتر واحد ممدود: خيوط زعفران نُقعت حتى صار الزيت بلون الآجرّ، وتحتها قليل من العود، والورد على الأطراف. يوضع على المعصم بالعود الزجاجي، ويدوم النهار كله.",
    flaconParams: {
      silhouette: "vial",
      aspect: 0.42,
      shoulder: 0.8,
      neck: 0.22,
      stopper: "rod",
      engraving: "vine",
      ornament: "saffron-crocus",
    },
    variants: [
      { label: "12 ml", priceFils: 680_00, sku: "AST-ST-AT-012", stock: 9 },
      { label: "3 ml", priceFils: 195_00, sku: "AST-ST-AT-003", stock: 0 },
    ],
    notes: [
      { noteId: "note-saffron", tier: "CHORD", weight: 3 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 3 },
      { noteId: "note-agarwood", tier: "CHORD", weight: 2 },
      { noteId: "note-taif-rose", tier: "CHORD", weight: 1 },
    ],
  },
];
