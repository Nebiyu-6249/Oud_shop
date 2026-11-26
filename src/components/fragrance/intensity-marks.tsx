/** Five engraved ticks, filled up to the intensity. */
export function IntensityMarks({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span role="img" aria-label={label} className="inline-flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            aria-hidden
            className={`h-4 w-1.5 border border-realm-accent ${i <= value ? "bg-realm-accent" : ""}`}
          />
        ))}
      </span>
      <span aria-hidden className="text-realm-ink/65">
        {label}
      </span>
    </span>
  );
}
