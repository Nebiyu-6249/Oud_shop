"use client";

import { useEffect, useRef } from "react";
import { polar } from "@/components/flacon/kit";
import { MARKS, R, markAngle, toPath, type Layer } from "./geometry";
import type { ChannelId, Mechanism } from "./mechanism";
import { type AstrolabeModel, type Highlight, STROKE } from "./model";

function LayerSvg({ layer }: { layer: Layer }) {
  const body = layer.hole ? `${toPath(layer.outline)}${toPath([...layer.hole].reverse())}` : toPath(layer.outline);
  return (
    <>
      <path d={body} fill="var(--realm-surface)" fillRule="evenodd" stroke="currentColor" strokeWidth={STROKE.main} />
      {layer.strokes.map((s, i) => (
        <path key={i} d={s.d} fill="none" strokeWidth={s.fine ? STROKE.fine : STROKE.main} />
      ))}
      {layer.texts.map((t, i) => (
        <text
          key={`t${i}`}
          x={t.x}
          y={t.y}
          transform={`rotate(${t.rotate} ${t.x} ${t.y})`}
          fontSize={t.size}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          stroke="none"
          className={t.font === "display" ? "font-display" : "font-body"}
        >
          {t.text}
        </text>
      ))}
    </>
  );
}

/**
 * The astrolabe as engraved line work. Rings are rotated by writing their
 * transforms directly each frame, so motion never re-renders React.
 */
export function AstrolabeSvg({
  model,
  mech,
  highlights,
  paused = false,
  className,
}: {
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  /** Stop driving the mechanism, e.g. once the WebGL scene has taken over. */
  paused?: boolean;
  className?: string;
}) {
  const plateRef = useRef<SVGGElement>(null);
  const wearRef = useRef<SVGGElement>(null);
  const reteRef = useRef<SVGGElement>(null);
  const ruleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const groups: [ChannelId, SVGGElement | null][] = [
      ["plate", plateRef.current],
      ["wear", wearRef.current],
      ["rete", reteRef.current],
      ["rule", ruleRef.current],
    ];
    const apply = () => {
      for (const [id, el] of groups) el?.setAttribute("transform", `rotate(${mech.channels[id].value.toFixed(3)})`);
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
  }, [mech, paused]);

  return (
    <svg
      viewBox="-1 -1 2 2"
      aria-hidden
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <LayerSvg layer={model.mater} />
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
      <g ref={plateRef}>
        <LayerSvg layer={model.plate} />
      </g>
      <g ref={wearRef}>
        <LayerSvg layer={model.wear} />
      </g>
      <g ref={reteRef}>
        <LayerSvg layer={model.rete} />
      </g>
      <g ref={ruleRef}>
        <LayerSvg layer={model.rule} />
      </g>
    </svg>
  );
}
