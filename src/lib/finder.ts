// Astrolabe scoring. Pure: no I/O, no randomness, same input gives same output.

export type Family = "FLORAL" | "AMBER" | "WOODY" | "FRESH";
export type Wear = "DAY" | "NIGHT" | "BOTH";
/** What the middle ring can be set to: a fragrance's wear, or either. */
export type WearChoice = "DAY" | "NIGHT" | "ANY";

/** Fragrance-wheel order. Neighbours on this circle get partial credit. */
export const WHEEL: readonly Family[] = ["FLORAL", "AMBER", "WOODY", "FRESH"];
export const WEAR_CHOICES: readonly WearChoice[] = ["DAY", "ANY", "NIGHT"];
export const INTENSITIES = [1, 2, 3, 4, 5] as const;

export type FinderInput = { family: Family; wear: WearChoice; intensity: number };

export type Candidate = {
  slug: string;
  family: Family;
  wear: Wear;
  intensity: number;
  realmSlug: string;
};

export type FamilyMatch = "same" | "neighbour" | "opposite";

export type Scored<C extends Candidate = Candidate> = {
  fragrance: C;
  score: number;
  family: FamilyMatch;
  wearMatch: boolean;
  intensityDistance: number;
};

export type FinderResult<C extends Candidate = Candidate> = {
  picks: Scored<C>[];
  /** True when nothing cleared the threshold: show "the closest we have". */
  closest: boolean;
};

export const WEIGHTS = { family: 0.5, wear: 0.25, intensity: 0.25 } as const;
/**
 * A pick "clears" when it scores at least this. A same-family fragrance with
 * the right wear clears at up to two steps of intensity; a neighbouring family
 * never clears on its own.
 */
export const THRESHOLD = 0.8;
const EPS = 1e-9;

export function familyMatch(want: Family, have: Family): FamilyMatch {
  const d = Math.abs(WHEEL.indexOf(want) - WHEEL.indexOf(have));
  const steps = Math.min(d, WHEEL.length - d);
  return steps === 0 ? "same" : steps === 1 ? "neighbour" : "opposite";
}

const FAMILY_SCORE: Record<FamilyMatch, number> = { same: 1, neighbour: 0.5, opposite: 0 };

export function wearMatches(want: WearChoice, have: Wear): boolean {
  return want === "ANY" || have === "BOTH" || want === have;
}

export function scoreOne<C extends Candidate>(input: FinderInput, c: C): Scored<C> {
  const family = familyMatch(input.family, c.family);
  const wearMatch = wearMatches(input.wear, c.wear);
  const intensityDistance = Math.abs(input.intensity - c.intensity);
  const score =
    WEIGHTS.family * FAMILY_SCORE[family] +
    WEIGHTS.wear * (wearMatch ? 1 : 0) +
    WEIGHTS.intensity * (1 - intensityDistance / 4);
  return { fragrance: c, score, family, wearMatch, intensityDistance };
}

function validate(input: FinderInput) {
  if (!WHEEL.includes(input.family)) throw new RangeError(`unknown family ${input.family}`);
  if (!WEAR_CHOICES.includes(input.wear)) throw new RangeError(`unknown wear ${input.wear}`);
  if (!Number.isInteger(input.intensity) || input.intensity < 1 || input.intensity > 5) {
    throw new RangeError(`intensity must be 1 to 5, got ${input.intensity}`);
  }
}

/**
 * The top `count` fragrances. Higher score always wins; among equal scores the
 * pick prefers a realm not yet represented, then falls back to slug order so
 * the result is stable.
 */
export function findFragrances<C extends Candidate>(
  input: FinderInput,
  candidates: readonly C[],
  count = 3,
): FinderResult<C> {
  validate(input);
  const pool = candidates.map((c) => scoreOne(input, c));
  const picks: Scored<C>[] = [];
  const usedRealms = new Set<string>();

  while (picks.length < count && pool.length > 0) {
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      const a = pool[i];
      const b = pool[best];
      if (a.score > b.score + EPS) {
        best = i;
      } else if (Math.abs(a.score - b.score) <= EPS) {
        const aNew = !usedRealms.has(a.fragrance.realmSlug);
        const bNew = !usedRealms.has(b.fragrance.realmSlug);
        if ((aNew && !bNew) || (aNew === bNew && a.fragrance.slug < b.fragrance.slug)) best = i;
      }
    }
    const [pick] = pool.splice(best, 1);
    picks.push(pick);
    usedRealms.add(pick.fragrance.realmSlug);
  }

  return { picks, closest: picks.length === 0 || picks[0].score < THRESHOLD - EPS };
}
