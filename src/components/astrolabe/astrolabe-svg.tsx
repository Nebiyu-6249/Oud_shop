"use client";

import { useEffect, useRef } from "react";
import { polar } from "@/components/flacon/kit";
import { MARKS, R, markAngle } from "./geometry";
import { LayerPart, astrolabeContainer, ringAnimation } from "./layer-svg";
import type { ChannelId, Mechanism } from "./mechanism";
import { type AstrolabeModel, type Highlight, STROKE } from "./model";

const RINGS = ["plate", "wear", "rete", "rule"] as const;

/**
 * The astrolabe as engraved line work, one stacked <svg> per moving part.
 * Each ring is its own compositor layer turned by a CSS transform, so motion
 * never repaints the engraving. Two ways to move:
 *
 * - `drift`: idle rotation as a pure CSS animation, no JavaScript per frame.
 * - otherwise: a frame loop that runs only while the mechanism is moving and
 *   writes transforms directly, so React never re-renders.
 */
export function AstrolabeSvg({
  model,
  mech,
  highlights,
  drift,
  paused = false,
  className,
}: {
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  /** Degrees per second for each ring, animated in CSS. */
  drift?: Partial<Record<ChannelId, number>>;
  /** Stop all motion, e.g. once the WebGL scene has taken over. */
  paused?: boolean;
  className?: string;
}) {
  const plateRef = useRef<HTMLDivElement>(null);
  const wearRef = useRef<HTMLDivElement>(null);
  const reteRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const refs = { plate: plateRef, wear: wearRef, rete: reteRef, rule: ruleRef };

  useEffect(() => {
    if (paused || drift) return;
    const groups: [ChannelId, HTMLDivElement | null][] = [
      ["plate", plateRef.current],
      ["wear", wearRef.current],
      ["rete", reteRef.current],
      ["rule", ruleRef.current],
    ];
    let raf = 0;
    const apply = () => {
      for (const [id, el] of groups) if (el) el.style.transform = `rotate(${mech.channels[id].value.toFixed(3)}deg)`;
    };
    const loop = (now: number) => {
      mech.step(now);
      apply();
      raf = mech.moving ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    apply();
    wake();
    const unsubscribe = mech.subscribe(wake);
    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, [mech, paused, drift]);

  return (
    <div aria-hidden className={className} style={astrolabeContainer}>
      <LayerPart layer={model.mater}>
        {Array.from({ length: MARKS }, (_, k) => {
          const h = highlights.find((x) => x.mark === k);
          if (!h) return null;
          const c = polar([0, 0], R.markRing, markAngle(k));
          return (
            <g key={k}>
              <circle cx={c[0]} cy={c[1]} r={0.026 - h.rank * 0.003} fill="var(--realm-glow)" stroke="none" />
              <circle cx={c[0]} cy={c[1]} r={0.03} fill="none" strokeWidth={STROKE.fine} />
            </g>
          );
        })}
      </LayerPart>
      {RINGS.map((id) => (
        <LayerPart
          key={id}
          ref={refs[id]}
          layer={model[id]}
          style={ringAnimation(mech.channels[id].value, paused ? 0 : (drift?.[id] ?? 0))}
        />
      ))}
    </div>
  );
}
