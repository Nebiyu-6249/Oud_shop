import type { FlaconParams } from "@/lib/flacon";
import { botanical } from "./botanicals";
import { VIEW_H, VIEW_W, buildFlacon } from "./geometry";
import type { Stroke } from "./kit";

function Strokes({ strokes, weight }: { strokes: Stroke[]; weight: number }) {
  return strokes.map((s, i) => (
    <path key={i} d={s.d} strokeWidth={s.fine ? weight * 0.45 : weight} />
  ));
}

/**
 * An engraved bottle drawn from its parameters. Strokes use the realm accent;
 * the label is filled with the realm base so the botanical reads cleanly.
 */
export function Flacon({
  params,
  id,
  label,
  className,
}: {
  params: FlaconParams;
  /** Unique per page, used for the clip path id. */
  id: string;
  label: string;
  className?: string;
}) {
  const f = buildFlacon(params);
  const clip = `flacon-clip-${id}`;
  const { cartouche: c } = f;
  const scale = c.size / 100;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={label}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id={clip}>
          <path d={f.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Strokes strokes={f.inside} weight={1.1} />
      </g>
      <path d={f.body} strokeWidth={1.6} />
      <Strokes strokes={f.outside} weight={1.2} />
      <path d={c.d} strokeWidth={1.1} fill="var(--realm-base)" />
      <g transform={`translate(${c.x - c.size / 2} ${c.y - c.size / 2}) scale(${scale})`}>
        <Strokes strokes={botanical(params.ornament)} weight={1.1 / scale / 1.6} />
      </g>
    </svg>
  );
}
