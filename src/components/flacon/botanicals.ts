// Engraved line drawings of the real botanicals behind each note. Every
// drawing sits in a 100 x 100 box. Keys match Note.ornamentKey.

import {
  type P,
  type Stroke,
  arc,
  berry,
  circle,
  ellipse,
  flower,
  frame,
  hatchBetween,
  leaf,
  line,
  needles,
  pinnate,
  polar,
  poly,
  smooth,
  tear,
  wavyPetal,
} from "./kit";

const s = (d: string): Stroke => ({ d });
const fine = (d: string): Stroke => ({ d, fine: true });

function rose(): Stroke[] {
  return [
    s(smooth([[50, 98], [52, 82], [48, 64], [50, 47]])),
    s(poly([[51.4, 86], [56, 84.5], [51.6, 83.4]])),
    s(poly([[49, 72], [44.5, 70.6], [49.2, 69.2]])),
    ...leaf([50.5, 78], -150, 20, 6, { serrate: true }),
    ...leaf([49, 62], -28, 18, 5.5, { serrate: true }),
    ...leaf([50, 47], -125, 11, 2.2, { veins: 0 }),
    ...leaf([50, 47], -55, 11, 2.2, { veins: 0 }),
    // the cup of outer petals
    s("M27 33C27 48 73 48 73 33"),
    s("M27 33C24 22 37 15 44 22"),
    s("M73 33C76 22 63 15 56 22"),
    s("M35 41C40 33 46 33 50 38C54 33 60 33 65 41"),
    s("M39 26C41 17 59 17 61 26"),
    // the closed spiral at the heart
    s("M50 31C44 31 42 25 47 22C53 19 58 24 55 28C52 31 47 30 47 27C47 25 50 24 51 26"),
    fine("M32 40C36 44 42 46 47 45"),
    fine("M68 40C64 44 58 46 53 45"),
    fine("M30 35C32 40 36 43 40 44"),
    fine("M70 35C68 40 64 43 60 44"),
    fine("M42 22C44 26 47 28 50 29"),
  ];
}

function jasmine(): Stroke[] {
  return [
    s(smooth([[50, 98], [50, 72], [48, 55]])),
    s(smooth([[48, 55], [41, 42], [35, 31]])),
    s(smooth([[48, 55], [56, 38], [62, 23]])),
    s(smooth([[50, 72], [60, 61], [67, 51]])),
    s(smooth([[41, 42], [42, 32], [44, 22]])),
    ...leaf([50, 82], 200, 16, 5),
    ...leaf([50, 82], -20, 16, 5),
    ...leaf([49.5, 64], 215, 13, 4),
    ...leaf([49.5, 64], -35, 13, 4),
    ...flower([35, 31], 5, 12, 3, -80, "pointed"),
    ...flower([62, 23], 5, 12, 3, -100, "pointed"),
    ...flower([67, 51], 5, 10, 2.6, -60, "pointed"),
    s(circle([35, 31], 1.4)),
    s(circle([62, 23], 1.4)),
    s(circle([67, 51], 1.2)),
    ...tear([44, 18], 5, 2, -95),
  ];
}

function saffronCrocus(): Stroke[] {
  const blades: Stroke[] = [
    ...leaf([50, 98], -112, 62, 1.6, { veins: 0 }),
    ...leaf([50, 98], -70, 58, 1.6, { veins: 0 }),
    ...leaf([50, 98], -100, 48, 1.4, { veins: 0 }),
    ...leaf([50, 98], -80, 52, 1.4, { veins: 0 }),
  ];
  return [
    ...blades,
    s(smooth([[50, 98], [50.5, 75], [50, 56]])),
    // back petals, then the three front petals of the cup
    ...leaf([50, 56], -102, 28, 6, { veins: 1, widest: 0.55 }),
    ...leaf([50, 56], -78, 28, 6, { veins: 1, widest: 0.55 }),
    ...leaf([50, 56], -116, 30, 7, { veins: 2, widest: 0.55 }),
    ...leaf([50, 56], -64, 30, 7, { veins: 2, widest: 0.55 }),
    ...leaf([50, 56], -90, 32, 7.5, { veins: 2, widest: 0.55 }),
    // three long stigmas, the saffron threads, with club tips
    s(smooth([[50, 42], [46, 22], [38, 12]])),
    s(smooth([[50, 42], [52, 20], [55, 8]])),
    s(smooth([[50, 42], [57, 24], [66, 16]])),
    ...tear([38, 12], 2.6, 1.3, -130),
    ...tear([55, 8], 2.6, 1.3, -80),
    ...tear([66, 16], 2.6, 1.3, -40),
    fine(line([48, 44], [45, 33])),
    fine(line([52, 44], [55, 33])),
  ];
}

function agarwood(): Stroke[] {
  const branch: P[] = [[8, 66], [30, 54], [55, 40], [80, 26], [94, 20]];
  const out: Stroke[] = [s(smooth(branch))];
  const nodes: [P, number][] = [
    [[22, 58.5], -140],
    [[34, 52], 40],
    [[46, 45], -130],
    [[58, 38], 50],
    [[70, 31.5], -120],
    [[82, 25], 55],
  ];
  for (const [p, a] of nodes) out.push(...leaf(p, a, 17, 4, { veins: 3, widest: 0.35 }));
  out.push(...leaf([94, 20], -25, 13, 3.4, { veins: 2 }));
  // a split log with the dark resin streaks that make the wood valuable
  out.push(
    s("M15 78L70 78"),
    s("M15 92L70 92"),
    s(ellipse([70, 85], 3.5, 7)),
    fine(ellipse([70, 85], 2.1, 4.4)),
    fine(ellipse([70, 85], 0.9, 2)),
    s(poly([[15, 78], [12.5, 81.5], [16, 84], [12.5, 88], [15, 92]])),
  );
  for (let i = 0; i < 5; i++) {
    const y = 80.5 + i * 2.4;
    out.push(fine(smooth([[18, y], [30, y + 0.9], [42, y - 0.8], [55, y + 0.7], [66, y]])));
  }
  for (let x = 20; x < 66; x += 3.2) {
    out.push(fine(line([x, 83.5], [x + 1.6, 87.5])));
  }
  return out;
}

function boswellia(): Stroke[] {
  return [
    // papery, gnarled trunk splitting in two
    s(smooth([[30, 98], [36, 82], [42, 66], [46, 56]])),
    s(smooth([[38, 98], [42, 84], [47, 70], [50, 58]])),
    s(smooth([[46, 56], [56, 42], [68, 28]])),
    s(smooth([[50, 58], [60, 46], [71, 31]])),
    s(smooth([[46, 58], [36, 46], [24, 36]])),
    s(smooth([[48, 62], [38, 50], [27, 39]])),
    fine(smooth([[34, 90], [38, 86], [37, 80]])),
    fine(smooth([[40, 78], [43, 73], [42, 68]])),
    ...pinnate([69, 29], -55, 22, 4, 6, 1.9),
    ...pinnate([70, 30], 10, 18, 3, 5.5, 1.8),
    ...pinnate([25, 37], -125, 22, 4, 6, 1.9),
    ...pinnate([26, 38], 175, 16, 3, 5, 1.7),
    // resin tears weeping from cuts in the bark
    ...tear([41, 72], 4.2, 2.6, 90),
    ...tear([45, 80], 3.6, 2.2, 90),
    ...tear([36, 66], 3.2, 2, 90),
    s(line([39, 70], [43, 69])),
  ];
}

function commiphora(): Stroke[] {
  const out: Stroke[] = [
    s(poly([[50, 98], [48, 80], [53, 66], [47, 52], [52, 38], [49, 24]])),
    s(poly([[48, 80], [34, 70], [26, 54], [18, 46]])),
    s(poly([[53, 66], [66, 58], [72, 44], [84, 36]])),
    s(poly([[47, 52], [38, 40], [34, 28]])),
  ];
  const thorns: [P, number][] = [
    [[49, 90], 200], [[51, 73], -20], [[49, 58], 190], [[51, 44], -10], [[30, 62], 230], [[69, 51], -40],
  ];
  for (const [p, a] of thorns) out.push(s(line(p, polar(p, 5, a))));
  const tuft = (c: P, a: number) => {
    for (const da of [-35, 0, 35]) out.push(...leaf(c, a + da, 8.5, 3, { veins: 1, widest: 0.7 }));
  };
  tuft([49, 24], -90);
  tuft([18, 46], -150);
  tuft([84, 36], -30);
  tuft([34, 28], -110);
  tuft([72, 44], -60);
  out.push(...tear([60, 88], 6, 4, -80), ...tear([70, 92], 4.5, 3, -100), ...tear([52, 61], 3.5, 2.2, 90));
  return out;
}

function cedar(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[6, 64], [30, 58], [58, 60], [94, 50]])),
    s(smooth([[30, 58], [24, 72], [20, 82]])),
    s(smooth([[58, 60], [64, 74], [70, 84]])),
  ];
  const tufts: P[] = [[14, 62], [24, 60], [40, 58], [50, 59.5], [76, 55], [88, 51.5], [22, 72], [20, 82], [64, 74], [70, 84]];
  for (const [i, p] of tufts.entries()) out.push(...needles(p, i % 2 ? 60 : -120, 110, 9, 7));
  // two upright barrel cones with overlapping scales
  for (const c of [[36, 42], [66, 42]] as P[]) {
    out.push(s(ellipse(c, 6.5, 11)));
    for (let r = -8; r <= 8; r += 3.2) {
      out.push(fine(arc([c[0], c[1] + r - 2], 6.3 * Math.sqrt(1 - (r / 11) ** 2), 20, 160)));
    }
    out.push(s(line([c[0], c[1] + 11], [c[0], c[1] + 16])));
  }
  return out;
}

function cypress(): Stroke[] {
  const out: Stroke[] = [s(smooth([[50, 98], [49, 70], [52, 40], [50, 10]]))];
  const sprays: [P, number, number][] = [
    [[49.5, 80], -150, 22], [[49.5, 80], -30, 22], [[50, 60], -145, 20], [[50, 60], -35, 20],
    [[51.5, 42], -140, 16], [[51.5, 42], -40, 16], [[51, 26], -125, 12], [[51, 26], -55, 12],
  ];
  for (const [p, a, len] of sprays) {
    const L = frame(p, a);
    out.push(s(smooth([p, L(len * 0.5, 1), L(len, 0)])));
    for (let u = 3; u < len; u += 3) {
      out.push(fine(poly([L(u - 2, 1.8), L(u, 0), L(u - 2, -1.8)])));
    }
  }
  // round cones of shield-shaped scales
  for (const c of [[30, 88], [72, 90]] as P[]) {
    out.push(s(circle(c, 6)));
    out.push(fine(poly([polar(c, 6, -90), c, polar(c, 6, 30)])));
    out.push(fine(line(c, polar(c, 6, 150))));
    out.push(fine(circle(c, 1.4)));
  }
  return out;
}

function juniper(): Stroke[] {
  const out: Stroke[] = [s(smooth([[20, 96], [36, 74], [54, 52], [76, 22]]))];
  for (let t = 0.08; t < 0.95; t += 0.09) {
    const p: P = [20 + 56 * t, 96 - 74 * t];
    out.push(...needles(p, -70, 70, 3, 7));
    out.push(...needles(p, 150, 60, 2, 6));
  }
  out.push(s(smooth([[48, 60], [56, 66], [62, 72]])));
  for (const c of [[62, 76], [69, 72], [57, 82], [66, 82], [72, 79]] as P[]) out.push(...berry(c, 4));
  return out;
}

function citrus(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[50, 37], [64, 40], [73, 52], [72, 68], [62, 80], [52, 84], [40, 80], [29, 68], [28, 52], [37, 40]], true)),
    s(circle([51, 85.5], 1.5)),
    s(smooth([[50, 37], [51, 28], [54, 18]])),
    ...leaf([53, 22], -20, 26, 8, { veins: 4 }),
    ...leaf([52, 26], 195, 8, 2.6, { veins: 0 }),
  ];
  // stippled oil glands and a crescent of shading on the shadow side
  for (let i = 0; i < 24; i++) {
    const a = i * 137.5;
    const r = 4 + 18 * Math.sqrt(i / 24);
    const p = polar([50, 60], r, a);
    out.push(fine(circle(p, 0.5)));
  }
  for (let i = 0; i < 4; i++) out.push(fine(arc([48, 60], 18 + i * 1.7, -20, 70)));
  return out;
}

function orangeBlossom(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[45, 98], [47, 70], [52, 50], [56, 40]])),
    s(smooth([[47, 70], [36, 58], [30, 48]])),
    ...leaf([46.5, 78], 200, 22, 7, { veins: 4 }),
    ...leaf([47.5, 66], -15, 20, 6.5, { veins: 4 }),
  ];
  for (const [c, rot] of [[[58, 30], -90], [[28, 40], -60]] as [P, number][]) {
    out.push(...flower(c, 5, 13, 4.2, rot, "round"));
    for (let i = 0; i < 9; i++) {
      const tip = polar(c, 6, rot + i * 40);
      out.push(fine(line(c, tip)), s(circle(tip, 0.7)));
    }
    out.push(s(circle(c, 1.6)));
  }
  out.push(...tear([66, 52], 5, 3.2, -60), s(smooth([[52, 50], [60, 54], [64, 54]])));
  return out;
}

function tuberose(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[50, 98], [50, 60], [51, 30], [50, 8]])),
    ...leaf([50, 98], -120, 34, 2, { veins: 0 }),
    ...leaf([50, 98], -60, 30, 2, { veins: 0 }),
  ];
  const blooms: [number, number][] = [[62, 1], [52, -1], [42, 1], [32, -1]];
  for (const [y, side] of blooms) {
    const base: P = [50.5, y];
    const mouth: P = [50.5 + side * 13, y - 9];
    out.push(s(smooth([base, [50.5 + side * 7, y - 2], mouth])));
    out.push(s(smooth([[50.5, y - 2], [50.5 + side * 6, y - 5], [mouth[0] - side * 1, mouth[1] - 2]])));
    out.push(...flower([mouth[0], mouth[1] - 1], 6, 6, 1.8, side > 0 ? -40 : -140, "pointed"));
  }
  for (const [y, side] of [[22, 1], [15, -1], [9, 1]] as [number, number][]) {
    out.push(...tear([50.5 + side * 5, y - 2], 4, 1.7, side > 0 ? -50 : -130));
  }
  return out;
}

function ambrette(): Stroke[] {
  const c: P = [44, 36];
  const out: Stroke[] = [
    s(smooth([[60, 98], [56, 76], [50, 58], [46, 46]])),
    ...flower(c, 5, 17, 9, -70, "wavy"),
    s(circle(c, 3.6)),
    fine(circle(c, 2)),
    s(smooth([c, [48, 30], [52, 24]])),
  ];
  for (let i = 0; i < 6; i++) out.push(s(circle(polar([50, 27], 2, i * 60), 0.6)));
  // palmately lobed leaf
  const L: P = [58, 74];
  out.push(...leaf(L, -30, 22, 5, { veins: 2, serrate: true }));
  out.push(...leaf(L, 10, 16, 4, { veins: 1, serrate: true }));
  out.push(...leaf(L, -70, 16, 4, { veins: 1, serrate: true }));
  // ribbed seed pod
  out.push(s(ellipse([24, 76], 6, 13)), s(smooth([[24, 89], [23, 94], [26, 98]])));
  for (const dx of [-3, 0, 3]) out.push(fine(smooth([[24 + dx * 0.4, 64], [24 + dx, 76], [24 + dx * 0.4, 88]])));
  return out;
}

function cardamom(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[10, 92], [30, 88], [52, 90], [70, 86]])),
    ...leaf([70, 86], -40, 32, 6, { veins: 5 }),
    ...leaf([30, 88], -100, 40, 5.5, { veins: 5 }),
  ];
  const pods: [P, number][] = [[[22, 80], -60], [[40, 82], -100], [[56, 80], -70]];
  for (const [base, a] of pods) {
    const L = frame(base, a);
    out.push(s(smooth([base, L(9, 5.5), L(20, 0), L(9, -5.5)], true)));
    for (const v of [-2.6, 0, 2.6]) out.push(fine(smooth([L(2, v * 0.4), L(10, v), L(18, v * 0.3)])));
  }
  // one split pod with its seeds
  const sp: P = [82, 60];
  out.push(s(smooth([[76, 66], [80, 54], [88, 52], [86, 62], [76, 66]])));
  for (const p of [[81, 58], [84, 56], [83, 61]] as P[]) out.push(s(circle(p, 1.2)));
  out.push(fine(circle(sp, 0.4)));
  return out;
}

function birch(): Stroke[] {
  const out: Stroke[] = [s(smooth([[6, 36], [30, 34], [56, 40], [92, 30]]))];
  const leaves: [P, number][] = [[[20, 35], 110], [[34, 34.5], -70], [[48, 38], 100], [[62, 39], -60], [[78, 34], 80]];
  for (const [p, a] of leaves) out.push(...leaf(p, a, 15, 6, { serrate: true, widest: 0.25, veins: 3 }));
  // a catkin hanging from the tip
  const cat: P[] = [];
  for (let i = 0; i < 7; i++) cat.push([92 + Math.sin(i * 0.5) * 1.2, 30 + i * 3]);
  out.push(s(smooth(cat)));
  for (const [x, y] of cat.slice(1)) out.push(fine(arc([x, y], 2, 200, 340)));
  // bark with its horizontal lenticels
  out.push(s("M12 70L88 70"), s("M12 90L88 90"), s(poly([[12, 70], [10, 75], [13, 80], [10, 86], [12, 90]])));
  out.push(s(ellipse([88, 80], 3.2, 10)));
  for (const [x, y, w] of [[20, 74, 10], [40, 78, 14], [62, 74, 8], [30, 85, 12], [56, 86, 16], [74, 81, 9]]) {
    out.push(s(line([x, y], [x + w, y])), fine(line([x + 1, y + 1.2], [x + w - 1, y + 1.2])));
  }
  return out;
}

function cyperus(): Stroke[] {
  const top: P = [50, 34];
  const out: Stroke[] = [s(smooth([[50, 86], [51, 60], [50, 34]]))];
  // involucral leaves spreading below the umbel
  for (const a of [-170, -150, -25, -5, 160]) out.push(...leaf(top, a, 26, 1.4, { veins: 0 }));
  // rays ending in narrow spikelets
  for (const a of [-160, -135, -110, -90, -70, -45, -20]) {
    const tip = polar(top, 18, a);
    out.push(s(line(top, tip)));
    for (const da of [-25, 0, 25]) out.push(...leaf(tip, a + da, 7, 1.1, { veins: 0, midrib: false }));
  }
  // the fragrant tuber and its roots
  out.push(s(ellipse([50, 91], 7, 4.5)));
  for (const dx of [-4, 0, 4]) out.push(fine(arc([50 + dx, 91], 4, 250, 290)));
  for (const [x, dx] of [[45, -6], [50, 0], [55, 6]]) out.push(fine(smooth([[x, 95], [x + dx * 0.5, 98], [x + dx, 100]])));
  return out;
}

function vetiver(): Stroke[] {
  const out: Stroke[] = [];
  const base: P = [50, 58];
  for (const a of [-125, -110, -98, -88, -76, -64, -52]) out.push(...leaf(base, a, 50 - Math.abs(a + 88) * 0.3, 1.5, { veins: 0 }));
  out.push(fine("M14 58L86 58"), fine("M20 60.5L32 60.5"), fine("M62 60.5L80 60.5"));
  // the dense fibrous roots where the scent is held
  for (let i = 0; i < 14; i++) {
    const x0 = 42 + i * 1.2;
    const sway = (i % 2 ? 1 : -1) * (3 + (i % 5));
    out.push(fine(smooth([[x0, 59], [x0 + sway * 0.6, 72], [x0 + sway * 1.2, 84], [x0 + sway * 1.4, 97]])));
  }
  for (const i of [0, 4, 8, 12]) out.push(s(smooth([[43 + i * 1.2, 59], [45 + i, 70], [42 + i * 1.5, 86]])));
  return out;
}

function pinkPepper(): Stroke[] {
  const out: Stroke[] = [
    s(smooth([[8, 20], [30, 26], [52, 24], [70, 30]])),
    ...pinnate([30, 26], -150, 24, 4, 7, 2),
    ...pinnate([70, 30], -20, 24, 4, 7, 2),
  ];
  // drooping panicle of berries
  const stem: P[] = [[52, 24], [54, 40], [52, 56], [55, 70]];
  out.push(s(smooth(stem)));
  const twigs: [P, number][] = [[[53.5, 34], 25], [[53.5, 44], 160], [[53, 52], 30], [[53.5, 62], 150], [[55, 70], 70]];
  for (const [p, a] of twigs) {
    const end = polar(p, 9, a);
    out.push(fine(line(p, end)));
    for (const [i, da] of [-40, 0, 40].entries()) out.push(...berry(polar(end, 2.6 + i * 0.3, a + da), 2.3));
  }
  return out;
}

function cistus(): Stroke[] {
  const c: P = [46, 40];
  const out: Stroke[] = [s(smooth([[56, 98], [52, 76], [48, 58], [46, 48]]))];
  for (let i = 0; i < 5; i++) {
    const a = -90 + i * 72;
    out.push(...wavyPetal(c, a, 20, 11));
    // the dark blotch at the base of each petal
    const L = frame(c, a);
    out.push(...hatchBetween((t) => L(6, -3 + 6 * t), (t) => L(10, -2.6 + 5.2 * t), 5));
  }
  for (let i = 0; i < 18; i++) {
    const tip = polar(c, 4.5 + (i % 3), i * 20);
    out.push(fine(line(c, tip)), s(circle(tip, 0.5)));
  }
  // narrow, sticky leaves
  out.push(...leaf([51, 70], 200, 22, 3.2, { veins: 4 }), ...leaf([52.5, 80], -25, 20, 3, { veins: 4 }));
  return out;
}

function sandalwood(): Stroke[] {
  const out: Stroke[] = [s(smooth([[8, 34], [28, 30], [52, 32], [80, 22]]))];
  for (const [x, y] of [[22, 31], [42, 31], [62, 28]] as P[]) {
    out.push(...leaf([x, y], -70, 14, 5, { veins: 3 }));
    out.push(...leaf([x, y], 110, 14, 5, { veins: 3 }));
  }
  out.push(s(smooth([[80, 22], [84, 30], [86, 38]])));
  for (const c of [[84, 41], [89, 38], [88, 45]] as P[]) out.push(...berry(c, 2.8));
  // a cross-section of heartwood with its growth rings and checks
  const ring: P = [44, 74];
  out.push(s(circle(ring, 18)));
  for (const r of [14.5, 11, 7.8, 4.6, 2]) {
    const pts: P[] = [];
    for (let i = 0; i < 12; i++) pts.push(polar(ring, r * (1 + 0.05 * Math.sin(i * 2.3)), i * 30));
    out.push(fine(smooth(pts, true)));
  }
  out.push(s(poly([[44, 74], [52, 66], [56, 64]])), s(line([44, 74], [32, 86])));
  return out;
}

function fallback(): Stroke[] {
  // An eight-pointed star: two squares turned 45 degrees.
  const c: P = [50, 50];
  const sq = (o: number) => poly([0, 1, 2, 3].map((i) => polar(c, 30, o + i * 90)), true);
  return [s(sq(0)), s(sq(45)), s(circle(c, 10)), fine(circle(c, 6))];
}

const DRAWINGS: Record<string, () => Stroke[]> = {
  rose,
  jasmine,
  "saffron-crocus": saffronCrocus,
  agarwood,
  boswellia,
  commiphora,
  cedar,
  cypress,
  juniper,
  citrus,
  "orange-blossom": orangeBlossom,
  tuberose,
  ambrette,
  cardamom,
  birch,
  cyperus,
  vetiver,
  "pink-pepper": pinkPepper,
  cistus,
  sandalwood,
};

export const BOTANICAL_KEYS = Object.keys(DRAWINGS);

const cache = new Map<string, Stroke[]>();

export function botanical(key: string): Stroke[] {
  let strokes = cache.get(key);
  if (!strokes) {
    strokes = (DRAWINGS[key] ?? fallback)();
    cache.set(key, strokes);
  }
  return strokes;
}

export const hasBotanical = (key: string) => key in DRAWINGS;
