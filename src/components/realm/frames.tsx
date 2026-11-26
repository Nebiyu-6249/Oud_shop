// Decorative section frames, one motif per realm, drawn as repeating SVG
// patterns in the realm accent. All are aria-hidden.

import type { ReactNode } from "react";

function Band({ id, w, h, children, height }: { id: string; w: number; h: number; height: number; children: ReactNode }) {
  return (
    <svg aria-hidden className="block w-full text-realm-accent" height={height} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            {children}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Horseshoe arcade: arches that close past the semicircle, on slim columns. */
export function Arcade({ id = "arcade" }: { id?: string }) {
  // A horseshoe arch: an arc of about 240 degrees, its feet tucked in.
  const arch = "M8 64 L8 40 A18 18 0 1 1 40 40 L40 64";
  return (
    <Band id={id} w={48} h={66} height={66}>
      <path d={arch} />
      <path d="M12 64 L12 40.5 A14 14 0 1 1 36 40.5 L36 64" strokeWidth="0.5" />
      <path d="M4 64 L4 38 M44 64 L44 38" strokeWidth="0.5" />
      <path d="M0 65.5 L48 65.5" />
      <path d="M24 4 L26 8 L24 12 L22 8 Z" strokeWidth="0.6" />
    </Band>
  );
}

/** Geometric tile: eight-pointed stars set in a square grid, joined by crosses. */
export function Tile({ id = "tile" }: { id?: string }) {
  return (
    <Band id={id} w={32} h={32} height={32}>
      <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" />
      <rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" strokeWidth="0.5" />
      <circle cx="16" cy="16" r="2.5" strokeWidth="0.5" />
      <path d="M0 0 L4 4 M32 0 L28 4 M0 32 L4 28 M32 32 L28 28" strokeWidth="0.5" />
    </Band>
  );
}

/** Still water: long, level ripples that thin out with distance. */
export function StillWater({ id = "water" }: { id?: string }) {
  return (
    <Band id={id} w={120} h={40} height={40}>
      <path d="M0 6 L120 6" />
      <path d="M6 14 L52 14 M66 14 L114 14" strokeWidth="0.6" />
      <path d="M18 21 L44 21 M78 21 L104 21" strokeWidth="0.5" />
      <path d="M30 28 L38 28 M86 28 L96 28" strokeWidth="0.4" />
      <path d="M52 34 L60 34" strokeWidth="0.3" />
    </Band>
  );
}

/** Dressed stone in staggered courses, for the cloister. */
export function Ashlar({ id = "ashlar" }: { id?: string }) {
  return (
    <Band id={id} w={64} h={28} height={28}>
      <path d="M0 0.5 L64 0.5 M0 14 L64 14 M0 27.5 L64 27.5" />
      <path d="M20 0.5 L20 14 M52 0.5 L52 14 M4 14 L4 27.5 M36 14 L36 27.5" />
      <path d="M24 4 L48 4 M8 18 L30 18" strokeWidth="0.4" />
    </Band>
  );
}

/** Brick courses of the kiln, with the vents left open in the bond. */
export function Brick({ id = "brick" }: { id?: string }) {
  return (
    <Band id={id} w={48} h={24} height={24}>
      <path d="M0 0.5 L48 0.5 M0 12 L48 12 M0 23.5 L48 23.5" />
      <path d="M12 0.5 L12 12 M36 0.5 L36 12 M0 12 L0 23.5 M24 12 L24 23.5" />
      <path d="M2 17 L10 17 M2 19 L10 19" strokeWidth="0.4" />
    </Band>
  );
}

/** Dune ridges, for the road. */
export function Dunes({ id = "dunes" }: { id?: string }) {
  return (
    <Band id={id} w={160} h={36} height={36}>
      <path d="M0 26 C30 10 50 10 80 22 C110 34 130 30 160 26" />
      <path d="M0 32 C34 22 56 22 84 30 C108 36 132 35 160 32" strokeWidth="0.5" />
      <path d="M40 15 C56 12 66 14 76 19" strokeWidth="0.4" />
    </Band>
  );
}

/** The frame that opens a realm section. */
export function RealmFrameTop({ slug }: { slug: string }) {
  switch (slug) {
    case "still-water-garden":
      return (
        <div>
          <Tile id={`tile-${slug}`} />
          <Arcade id={`arcade-${slug}`} />
        </div>
      );
    case "frost-cloister":
      return <Ashlar id={`ashlar-${slug}`} />;
    case "ember-kiln":
      return <Brick id={`brick-${slug}`} />;
    case "caravanserai":
      return <Dunes id={`dunes-${slug}`} />;
    default:
      return null;
  }
}

/** The frame that closes a realm section. */
export function RealmFrameBottom({ slug }: { slug: string }) {
  if (slug === "still-water-garden") return <StillWater id={`water-${slug}`} />;
  return <div className="rule border-t" />;
}
