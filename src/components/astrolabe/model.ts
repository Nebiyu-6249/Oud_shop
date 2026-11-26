import { mater, plate, rete, rule, wearRing, type Layer, type WearSymbol } from "./geometry";

export type AstrolabeLabels = {
  families: string[];
  wear: string[];
  wearSymbols: WearSymbol[];
  intensities: string[];
};

export type AstrolabeModel = Record<"mater" | "plate" | "wear" | "rete" | "rule", Layer>;

export function buildModel(l: AstrolabeLabels): AstrolabeModel {
  return {
    mater: mater([]),
    plate: plate(l.intensities),
    wear: wearRing(l.wear, l.wearSymbols),
    rete: rete(l.families),
    rule: rule(),
  };
}

/** A highlighted limb mark: the fragrance at `mark`, ranked 1 to 3. */
export type Highlight = { mark: number; rank: number };

export const STROKE = { main: 0.0042, fine: 0.0018 } as const;
