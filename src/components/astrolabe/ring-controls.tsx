"use client";

import type { KeyboardEvent } from "react";

export type RingControl = {
  id: string;
  label: string;
  options: string[];
  index: number;
  onChange: (index: number) => void;
};

/**
 * One slider per ring. They are the accessible way to set the astrolabe and
 * also a plain readout of what is under the index.
 */
export function RingControls({ rings, back, forward }: { rings: RingControl[]; back: string; forward: string }) {
  return (
    <div className="space-y-1">
      {rings.map((r) => {
        const n = r.options.length;
        const go = (i: number) => r.onChange(((i % n) + n) % n);
        const onKey = (e: KeyboardEvent) => {
          const map: Record<string, () => void> = {
            ArrowRight: () => go(r.index + 1),
            ArrowUp: () => go(r.index + 1),
            ArrowLeft: () => go(r.index - 1),
            ArrowDown: () => go(r.index - 1),
            Home: () => go(0),
            End: () => go(n - 1),
          };
          const fn = map[e.key];
          if (fn) {
            e.preventDefault();
            fn();
          }
        };
        return (
          <div key={r.id} className="rule grid grid-cols-[1fr_auto] items-center gap-3 border-b py-3">
            <div
              role="slider"
              tabIndex={0}
              aria-label={r.label}
              aria-valuemin={1}
              aria-valuemax={n}
              aria-valuenow={r.index + 1}
              aria-valuetext={r.options[r.index]}
              onKeyDown={onKey}
              className="-mx-2 cursor-default rounded-sm px-2 py-1"
            >
              <span className="block text-sm tracking-[0.15em] text-realm-ink/65 uppercase">{r.label}</span>
              <span className="font-display block text-2xl text-realm-accent">{r.options[r.index]}</span>
            </div>
            <div className="flex gap-1" aria-hidden>
              {[
                [back, -1, "M15 5 L8 12 L15 19"],
                [forward, 1, "M9 5 L16 12 L9 19"],
              ].map(([title, step, d]) => (
                <button
                  key={title as string}
                  type="button"
                  tabIndex={-1}
                  title={`${title} ${r.label}`}
                  onClick={() => go(r.index + (step as number))}
                  className="rule grid h-11 w-11 place-items-center border text-realm-ink/80 hover:border-realm-accent hover:text-realm-accent"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 rtl:-scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={d as string} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
