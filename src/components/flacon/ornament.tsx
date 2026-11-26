import { botanical } from "./botanicals";

/** One engraved botanical, drawn in the current text colour. */
export function Ornament({
  ornamentKey,
  label,
  className,
}: {
  ornamentKey: string;
  /** Omit for a purely decorative ornament. */
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      data-draw
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {botanical(ornamentKey).map((s, i) => (
        <path key={i} d={s.d} pathLength={1} strokeWidth={s.fine ? 0.4 : 0.9} />
      ))}
    </svg>
  );
}
