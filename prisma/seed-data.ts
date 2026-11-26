// Catalogue content: four realms, twelve fragrances (per realm one EDP or
// extrait, one attar, one bakhoor). subfamily is a key into the Subfamily
// messages so it can be translated.
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
  { id: "note-frankincense", nameEn: "Frankincense", nameAr: "لبان", ornamentKey: "boswellia" },
  { id: "note-myrrh", nameEn: "Myrrh", nameAr: "مرّ", ornamentKey: "commiphora" },
  { id: "note-juniper", nameEn: "Juniper berry", nameAr: "توت العرعر", ornamentKey: "juniper" },
  { id: "note-cypress", nameEn: "Cypress", nameAr: "سرو", ornamentKey: "cypress" },
  { id: "note-cedar", nameEn: "Atlas cedar", nameAr: "أرز أطلسي", ornamentKey: "cedar" },
  { id: "note-bergamot", nameEn: "Bergamot", nameAr: "برغموت", ornamentKey: "citrus" },
  { id: "note-neroli", nameEn: "Orange blossom", nameAr: "زهر البرتقال", ornamentKey: "orange-blossom" },
  { id: "note-jasmine", nameEn: "Jasmine sambac", nameAr: "فل", ornamentKey: "jasmine" },
  { id: "note-tuberose", nameEn: "Tuberose", nameAr: "مسك الروم", ornamentKey: "tuberose" },
  { id: "note-ambrette", nameEn: "Ambrette seed", nameAr: "بذور العنبريت", ornamentKey: "ambrette" },
  { id: "note-cardamom", nameEn: "Cardamom", nameAr: "هيل", ornamentKey: "cardamom" },
  { id: "note-birch", nameEn: "Birch tar", nameAr: "قطران البتولا", ornamentKey: "birch" },
  { id: "note-cypriol", nameEn: "Cypriol", nameAr: "سعد", ornamentKey: "cyperus" },
  { id: "note-vetiver", nameEn: "Vetiver", nameAr: "نجيل الهند", ornamentKey: "vetiver" },
];

export const realms: SeedRealm[] = [
  {
    slug: "frost-cloister",
    nameEn: "The Frost Cloister",
    nameAr: "صومعة الصقيع",
    storyEn:
      "High in the cold, a walled house of grey stone keeps its censers burning through the winter. Resin smoke hangs in the vaults and does not move. The air is iron and frost, juniper on the hillside, frankincense on the coals. Its perfumes are clear and dry, like breath you can see.",
    storyAr:
      "في أعالي البرد دارٌ مسوّرة من حجر رمادي، تُبقي مباخرها مشتعلة طوال الشتاء. يعلق دخان الراتنج في الأقبية ولا يتحرك. الهواء حديد وصقيع، عرعر على السفح ولبان على الجمر. عطورها صافية جافة، كأنفاس تراها في البرد.",
    palette: { base: "#0A0D10", surface: "#141B21", accent: "#A9C1CF", ink: "#E4E8E8", glow: "#4F6B7E" },
    sortOrder: 1,
  },
  {
    slug: "still-water-garden",
    nameEn: "The Still-Water Garden",
    nameAr: "بستان الماء الساكن",
    storyEn:
      "Behind a horseshoe arch, a long pool lies between orange trees and walls of turquoise tile. Nothing moves the water, so the roses grow twice: once on the bough and once below it. Here the flowers are picked at dawn, before the heat takes them, and kept in the cool of the arcade.",
    storyAr:
      "خلف قوس على هيئة حدوة، تمتد بركة طويلة بين أشجار البرتقال وجدران من الزليج الفيروزي. لا شيء يحرّك الماء، فينبت الورد مرتين: مرة على الغصن ومرة تحته. هنا تُقطف الأزهار عند الفجر قبل أن يأخذها الحرّ، وتُحفظ في ظلّ الرواق.",
    palette: { base: "#081110", surface: "#10201E", accent: "#4FB3A9", ink: "#F2E8DA", glow: "#C27A72" },
    sortOrder: 2,
  },
  {
    slug: "ember-kiln",
    nameEn: "The Ember Kiln",
    nameAr: "أتون الجمر",
    storyEn:
      "Agarwood is the heartwood a tree makes when it is wounded and survives. The Kiln is where that wood meets the coal: a low room of blackened brick, its air gold with saffron and slow with smoke. Its perfumes are dense and warm, and made for the evening.",
    storyAr:
      "العود هو قلب الشجرة الذي تصنعه حين تُجرح فتنجو. وفي الأتون يلتقي هذا الخشب بالجمر: غرفة منخفضة من آجرّ مسودّ، هواؤها ذهبي بالزعفران وثقيل بالدخان. عطورها كثيفة دافئة، صُنعت للمساء.",
    palette: { base: "#0B0807", surface: "#1A1210", accent: "#C9A24A", ink: "#EFE3CB", glow: "#9E2A1C" },
    sortOrder: 3,
  },
  {
    slug: "caravanserai",
    nameEn: "The Caravanserai",
    nameAr: "خان القوافل",
    storyEn:
      "At the last well before the sand, the caravans unload in a square courtyard of mud brick. Saddles are oiled, cardamom is pounded for coffee, and sandalwood traded by weight. The perfumes of the road are dry woods and leather, warmed by sun all day and by fire all night.",
    storyAr:
      "عند آخر بئر قبل الرمل، تحطّ القوافل أحمالها في فناء مربّع من الطين. تُدهن السروج، ويُدقّ الهيل للقهوة، ويُباع الصندل بالوزن. عطور الطريق أخشاب جافة وجلد، تدفئها الشمس نهارًا والنار ليلًا.",
    palette: { base: "#120D08", surface: "#231910", accent: "#D19A48", ink: "#F0E2C8", glow: "#7A4A2A" },
    sortOrder: 4,
  },
];

const v = (label: string, aed: number, sku: string, stock: number) => ({
  label,
  priceFils: aed * 100,
  sku,
  stock,
});

export const fragrances: SeedFragrance[] = [
  // The Frost Cloister
  {
    slug: "cold-censer",
    nameEn: "Cold Censer",
    nameAr: "المبخرة الباردة",
    realmSlug: "frost-cloister",
    family: "FRESH",
    subfamily: "aromatic",
    form: "EDP",
    structure: "PYRAMID",
    intensity: 3,
    wear: "DAY",
    storyEn:
      "The censer has gone out overnight and the cloister is cold. What is left is the ghost of the smoke: juniper and cypress from the hillside, frankincense in the stone, and a dry cedar floor under it all.",
    storyAr:
      "انطفأت المبخرة في الليل وبردت الصومعة. ما بقي هو طيف الدخان: عرعر وسرو من السفح، ولبان في الحجر، وأرضية من الأرز الجاف تحت ذلك كله.",
    flaconParams: { silhouette: "column", aspect: 0.48, shoulder: 0.15, neck: 0.1, stopper: "dome", engraving: "kufic-band", ornament: "juniper" },
    variants: [v("100 ml", 980, "AST-CC-EDP-100", 12), v("50 ml", 650, "AST-CC-EDP-050", 20)],
    notes: [
      { noteId: "note-juniper", tier: "TOP", weight: 3 },
      { noteId: "note-cypress", tier: "TOP", weight: 2 },
      { noteId: "note-frankincense", tier: "HEART", weight: 3 },
      { noteId: "note-cedar", tier: "BASE", weight: 2 },
      { noteId: "note-myrrh", tier: "BASE", weight: 1 },
    ],
  },
  {
    slug: "first-frost",
    nameEn: "First Frost",
    nameAr: "الصقيع الأول",
    realmSlug: "frost-cloister",
    family: "FRESH",
    subfamily: "citrus-resin",
    form: "ATTAR",
    structure: "CHORD",
    intensity: 2,
    wear: "DAY",
    storyEn:
      "Pale frankincense tears, the kind that smell of lemon peel before they smell of smoke, distilled into sandalwood with a little bergamot. One chord, bright and cold, that stays close to the skin.",
    storyAr:
      "دموع لبان شاحبة، من النوع الذي تفوح منه قشرة الليمون قبل الدخان، مقطّرة في الصندل مع قليل من البرغموت. وتر واحد مشرق بارد، يبقى قريبًا من الجلد.",
    flaconParams: { silhouette: "vial", aspect: 0.4, shoulder: 0.6, neck: 0.24, stopper: "rod", engraving: "lattice", ornament: "boswellia" },
    variants: [v("12 ml", 450, "AST-FF-AT-012", 11), v("3 ml", 145, "AST-FF-AT-003", 30)],
    notes: [
      { noteId: "note-frankincense", tier: "CHORD", weight: 3 },
      { noteId: "note-bergamot", tier: "CHORD", weight: 2 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 2 },
    ],
  },
  {
    slug: "stone-vigil",
    nameEn: "Stone Vigil",
    nameAr: "سهر الحجر",
    realmSlug: "frost-cloister",
    family: "AMBER",
    subfamily: "incense",
    form: "BAKHOOR",
    structure: "CHORD",
    intensity: 3,
    wear: "NIGHT",
    storyEn:
      "Agarwood chips soaked with frankincense and myrrh, then dried slowly in the cold. Set one on the coal and the room fills with the long, grey smoke of a night spent awake.",
    storyAr:
      "رقائق عود منقوعة باللبان والمرّ، ثم مجففة على مهل في البرد. ضع واحدة على الجمر فيمتلئ المكان بدخان رمادي طويل، دخان ليلة قُضيت ساهرًا.",
    flaconParams: { silhouette: "jar", aspect: 1.05, shoulder: 0.4, neck: 0.04, stopper: "lid", engraving: "kufic-band", ornament: "commiphora" },
    variants: [v("60 g", 240, "AST-SV-BK-060", 18), v("120 g", 420, "AST-SV-BK-120", 6)],
    notes: [
      { noteId: "note-frankincense", tier: "CHORD", weight: 3 },
      { noteId: "note-myrrh", tier: "CHORD", weight: 2 },
      { noteId: "note-agarwood", tier: "CHORD", weight: 2 },
    ],
  },

  // The Still-Water Garden
  {
    slug: "rosewater-basin",
    nameEn: "Rosewater Basin",
    nameAr: "حوض ماء الورد",
    realmSlug: "still-water-garden",
    family: "FLORAL",
    subfamily: "rose",
    form: "EDP",
    structure: "PYRAMID",
    intensity: 2,
    wear: "DAY",
    storyEn:
      "Rose petals floated in the basin at the head of the pool, the morning after they were picked. Bergamot and orange blossom from the trees around it, jasmine in the shade, and the soft, seed-like musk of ambrette beneath.",
    storyAr:
      "بتلات ورد تطفو في الحوض عند رأس البركة، صباح اليوم التالي لقطفها. برغموت وزهر برتقال من الأشجار حولها، وفلّ في الظل، ومسك العنبريت الناعم في القاع.",
    flaconParams: { silhouette: "ewer", aspect: 0.62, shoulder: 0.5, neck: 0.22, stopper: "finial", engraving: "lattice", ornament: "rose" },
    variants: [v("100 ml", 920, "AST-RB-EDP-100", 9), v("50 ml", 610, "AST-RB-EDP-050", 16)],
    notes: [
      { noteId: "note-bergamot", tier: "TOP", weight: 2 },
      { noteId: "note-neroli", tier: "TOP", weight: 2 },
      { noteId: "note-taif-rose", tier: "HEART", weight: 3 },
      { noteId: "note-jasmine", tier: "HEART", weight: 1 },
      { noteId: "note-ambrette", tier: "BASE", weight: 2 },
    ],
  },
  {
    slug: "night-jasmine",
    nameEn: "Night Jasmine",
    nameAr: "فلّ الليل",
    realmSlug: "still-water-garden",
    family: "FLORAL",
    subfamily: "white-floral",
    form: "ATTAR",
    structure: "CHORD",
    intensity: 3,
    wear: "NIGHT",
    storyEn:
      "Jasmine sambac opens after dark, and is gathered then, by lamp. Here it is distilled into sandalwood with tuberose: a single, heady chord, the garden at the hour when the water turns black.",
    storyAr:
      "يتفتح الفلّ بعد الغروب، ويُجمع حينها على ضوء السراج. هنا يُقطّر في الصندل مع مسك الروم: وتر واحد آسر، البستان في الساعة التي يسودّ فيها الماء.",
    flaconParams: { silhouette: "vial", aspect: 0.46, shoulder: 0.85, neck: 0.2, stopper: "faceted", engraving: "vine", ornament: "jasmine" },
    variants: [v("12 ml", 560, "AST-NJ-AT-012", 7), v("3 ml", 175, "AST-NJ-AT-003", 25)],
    notes: [
      { noteId: "note-jasmine", tier: "CHORD", weight: 3 },
      { noteId: "note-tuberose", tier: "CHORD", weight: 2 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 2 },
    ],
  },
  {
    slug: "terracotta-rose",
    nameEn: "Terracotta Rose",
    nameAr: "ورد الفخار",
    realmSlug: "still-water-garden",
    family: "FLORAL",
    subfamily: "floral-oud",
    form: "BAKHOOR",
    structure: "CHORD",
    intensity: 3,
    wear: "BOTH",
    storyEn:
      "Rose bakhoor, as it is burned to welcome guests: chips of agarwood and sandalwood steeped in Taif rose and baked in clay pots in the sun. The smoke comes up pink at first, then warm and woody.",
    storyAr:
      "بخور الورد كما يُحرق لاستقبال الضيوف: رقائق عود وصندل منقوعة بالورد الطائفي ومخبوزة في قدور فخار تحت الشمس. يصعد الدخان ورديًا في البداية، ثم دافئًا خشبيًا.",
    flaconParams: { silhouette: "jar", aspect: 1.1, shoulder: 0.7, neck: 0.04, stopper: "lid", engraving: "lattice", ornament: "rose" },
    variants: [v("60 g", 260, "AST-TR-BK-060", 22), v("120 g", 460, "AST-TR-BK-120", 4)],
    notes: [
      { noteId: "note-taif-rose", tier: "CHORD", weight: 3 },
      { noteId: "note-agarwood", tier: "CHORD", weight: 2 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 2 },
    ],
  },

  // The Ember Kiln
  {
    slug: "ninth-ember",
    nameEn: "Ninth Ember",
    nameAr: "الجمرة التاسعة",
    realmSlug: "ember-kiln",
    family: "WOODY",
    subfamily: "oud",
    form: "EXTRAIT",
    structure: "PYRAMID",
    intensity: 5,
    wear: "NIGHT",
    storyEn:
      "Nine coals are laid under the censer before the oud goes on. By the ninth, the room has stopped talking. Saffron opens it, red and metallic; Taif rose softens the middle; then the agarwood arrives, resinous and animal, and stays on wool until morning.",
    storyAr:
      "تُرصّ تسع جمرات تحت المبخرة قبل أن يوضع العود. وعند التاسعة يكون المجلس قد سكت. يفتتحه الزعفران أحمر معدنيًا، ويليّن الورد الطائفي وسطه، ثم يحلّ العود راتنجيًا حيوانيًا، ويبقى على الصوف حتى الصباح.",
    flaconParams: { silhouette: "flask", aspect: 0.72, shoulder: 0.35, neck: 0.12, stopper: "faceted", engraving: "kufic-band", ornament: "agarwood" },
    variants: [v("100 ml", 1890, "AST-NE-EX-100", 3), v("50 ml", 1150, "AST-NE-EX-050", 14)],
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
    subfamily: "spiced-amber",
    form: "ATTAR",
    structure: "CHORD",
    intensity: 4,
    wear: "BOTH",
    storyEn:
      "Attars are distilled into sandalwood oil, not alcohol, so nothing lifts off first and nothing is left alone at the end. This one is a single held chord: saffron threads steeped until the oil turns the colour of brick, a little oud beneath, rose at the edges. Laid on the wrist with the glass rod, it lasts the day.",
    storyAr:
      "تُقطَّر العطور الزيتية في زيت الصندل لا في الكحول، فلا شيء يتطاير أولًا ولا شيء يبقى وحيدًا في الآخر. هذا العطر وتر واحد ممدود: خيوط زعفران نُقعت حتى صار الزيت بلون الآجرّ، وتحتها قليل من العود، والورد على الأطراف. يوضع على المعصم بالعود الزجاجي، ويدوم النهار كله.",
    flaconParams: { silhouette: "vial", aspect: 0.42, shoulder: 0.8, neck: 0.22, stopper: "rod", engraving: "vine", ornament: "saffron-crocus" },
    variants: [v("12 ml", 680, "AST-ST-AT-012", 9), v("3 ml", 195, "AST-ST-AT-003", 0)],
    notes: [
      { noteId: "note-saffron", tier: "CHORD", weight: 3 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 3 },
      { noteId: "note-agarwood", tier: "CHORD", weight: 2 },
      { noteId: "note-taif-rose", tier: "CHORD", weight: 1 },
    ],
  },
  {
    slug: "banked-coals",
    nameEn: "Banked Coals",
    nameAr: "الجمر المدفون",
    realmSlug: "ember-kiln",
    family: "WOODY",
    subfamily: "oud",
    form: "BAKHOOR",
    structure: "CHORD",
    intensity: 5,
    wear: "NIGHT",
    storyEn:
      "Coals covered with ash at the end of the night still glow by morning. This is the bakhoor for that hour: dark agarwood soaked with labdanum and a thread of saffron, burned slowly so the smoke stays low and heavy.",
    storyAr:
      "الجمر المغطى بالرماد آخر الليل يبقى متوهجًا حتى الصباح. هذا بخور تلك الساعة: عود داكن منقوع باللادن مع خيط من الزعفران، يُحرق ببطء فيبقى الدخان منخفضًا ثقيلًا.",
    flaconParams: { silhouette: "jar", aspect: 0.95, shoulder: 0.2, neck: 0.04, stopper: "lid", engraving: "kufic-band", ornament: "agarwood" },
    variants: [v("60 g", 380, "AST-BC-BK-060", 10), v("120 g", 690, "AST-BC-BK-120", 2)],
    notes: [
      { noteId: "note-agarwood", tier: "CHORD", weight: 3 },
      { noteId: "note-labdanum", tier: "CHORD", weight: 2 },
      { noteId: "note-saffron", tier: "CHORD", weight: 1 },
    ],
  },

  // The Caravanserai
  {
    slug: "long-road",
    nameEn: "Long Road",
    nameAr: "الدرب الطويل",
    realmSlug: "caravanserai",
    family: "WOODY",
    subfamily: "leather",
    form: "EXTRAIT",
    structure: "PYRAMID",
    intensity: 4,
    wear: "DAY",
    storyEn:
      "A saddle that has crossed the sand and back. Cardamom from the coffee pot at the start, then the smoky, earthy root of cypriol, and finally birch tar and cedar: leather oiled, sun-dried and oiled again.",
    storyAr:
      "سرج عبر الرمل ذهابًا وإيابًا. هيل من دلّة القهوة في البداية، ثم جذر السعد الترابي المدخّن، وأخيرًا قطران البتولا والأرز: جلد دُهن وجُفّف في الشمس ثم دُهن من جديد.",
    flaconParams: { silhouette: "flask", aspect: 0.82, shoulder: 0.1, neck: 0.08, stopper: "dome", engraving: "kufic-band", ornament: "birch" },
    variants: [v("100 ml", 1620, "AST-LR-EX-100", 5), v("50 ml", 1040, "AST-LR-EX-050", 13)],
    notes: [
      { noteId: "note-cardamom", tier: "TOP", weight: 3 },
      { noteId: "note-pink-pepper", tier: "TOP", weight: 1 },
      { noteId: "note-cypriol", tier: "HEART", weight: 2 },
      { noteId: "note-birch", tier: "BASE", weight: 3 },
      { noteId: "note-cedar", tier: "BASE", weight: 2 },
    ],
  },
  {
    slug: "well-shade",
    nameEn: "Well Shade",
    nameAr: "ظلّ البئر",
    realmSlug: "caravanserai",
    family: "FRESH",
    subfamily: "green",
    form: "ATTAR",
    structure: "CHORD",
    intensity: 1,
    wear: "DAY",
    storyEn:
      "Vetiver roots are woven into screens and hung wet in doorways to cool the air. This attar is that shade by the well: green, damp and earthy vetiver over sandalwood, with a breath of cardamom.",
    storyAr:
      "تُنسج جذور نجيل الهند ستائر تُعلّق مبلّلة على الأبواب لتبريد الهواء. هذا العطر هو ذلك الظل عند البئر: نجيل هند أخضر رطب ترابي فوق الصندل، مع نفحة من الهيل.",
    flaconParams: { silhouette: "vial", aspect: 0.5, shoulder: 0.5, neck: 0.18, stopper: "finial", engraving: "none", ornament: "vetiver" },
    variants: [v("12 ml", 420, "AST-WS-AT-012", 15), v("3 ml", 135, "AST-WS-AT-003", 28)],
    notes: [
      { noteId: "note-vetiver", tier: "CHORD", weight: 3 },
      { noteId: "note-sandalwood", tier: "CHORD", weight: 2 },
      { noteId: "note-cardamom", tier: "CHORD", weight: 1 },
    ],
  },
  {
    slug: "caravan-fire",
    nameEn: "Caravan Fire",
    nameAr: "نار القافلة",
    realmSlug: "caravanserai",
    family: "AMBER",
    subfamily: "woody-amber",
    form: "BAKHOOR",
    structure: "CHORD",
    intensity: 4,
    wear: "NIGHT",
    storyEn:
      "The fire in the courtyard after the gates are shut. Sandalwood and cypriol chips soaked with labdanum, a little agarwood for depth. Burned on a single coal, it scents a room and the clothes of everyone in it.",
    storyAr:
      "نار الفناء بعد إغلاق الأبواب. رقائق صندل وسعد منقوعة باللادن، مع قليل من العود للعمق. تُحرق على جمرة واحدة فتعطّر المكان وثياب كل من فيه.",
    flaconParams: { silhouette: "jar", aspect: 1.0, shoulder: 0.6, neck: 0.04, stopper: "lid", engraving: "vine", ornament: "cyperus" },
    variants: [v("60 g", 220, "AST-CF-BK-060", 24), v("120 g", 390, "AST-CF-BK-120", 8)],
    notes: [
      { noteId: "note-sandalwood", tier: "CHORD", weight: 3 },
      { noteId: "note-labdanum", tier: "CHORD", weight: 2 },
      { noteId: "note-cypriol", tier: "CHORD", weight: 2 },
      { noteId: "note-agarwood", tier: "CHORD", weight: 1 },
    ],
  },
];
