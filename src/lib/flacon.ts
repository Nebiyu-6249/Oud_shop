// Parameters for the engraved SVG flacon generator. Stored as Fragrance.flaconParams.

export const SILHOUETTES = ["flask", "ewer", "column", "vial", "jar"] as const;
export const STOPPERS = ["dome", "finial", "faceted", "rod", "lid"] as const;
export const ENGRAVINGS = ["kufic-band", "lattice", "vine", "none"] as const;

export type FlaconParams = {
  silhouette: (typeof SILHOUETTES)[number];
  /** Body width relative to height, 0.3 to 1.2 */
  aspect: number;
  /** Shoulder roundness, 0 (square) to 1 (fully round) */
  shoulder: number;
  /** Neck length relative to body height, 0 to 0.4 */
  neck: number;
  stopper: (typeof STOPPERS)[number];
  engraving: (typeof ENGRAVINGS)[number];
  /** Note.ornamentKey drawn on the body */
  ornament: string;
};

export function parseFlaconParams(value: unknown): FlaconParams {
  const v = value as Partial<FlaconParams> | null;
  if (!v || typeof v !== "object") throw new TypeError("flaconParams must be an object");
  const inRange = (n: unknown, lo: number, hi: number) =>
    typeof n === "number" && n >= lo && n <= hi;
  if (!SILHOUETTES.includes(v.silhouette as never)) throw new TypeError(`bad silhouette ${v.silhouette}`);
  if (!STOPPERS.includes(v.stopper as never)) throw new TypeError(`bad stopper ${v.stopper}`);
  if (!ENGRAVINGS.includes(v.engraving as never)) throw new TypeError(`bad engraving ${v.engraving}`);
  if (!inRange(v.aspect, 0.3, 1.2)) throw new TypeError(`bad aspect ${v.aspect}`);
  if (!inRange(v.shoulder, 0, 1)) throw new TypeError(`bad shoulder ${v.shoulder}`);
  if (!inRange(v.neck, 0, 0.4)) throw new TypeError(`bad neck ${v.neck}`);
  if (typeof v.ornament !== "string" || !v.ornament) throw new TypeError("ornament required");
  return v as FlaconParams;
}
