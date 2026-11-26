// Shared drawing of one astrolabe part. No client code: used both by the
// interactive finder and by the server-rendered idle instrument.
//
// Line work is SVG; the engraved labels are HTML text laid over it. Chrome
// measures SVG text inside a scaled viewBox against the whole drawing, which
// made a tiny numeral the page's "largest contentful paint"; HTML text is
// measured at its real size, so the hero heading stays the LCP element.

import type { CSSProperties, Ref } from "react";
import { circle } from "@/components/flacon/kit";
import { toPath, type Layer } from "./geometry";
import { STROKE } from "./model";

const svgProps = {
  viewBox: "-1 -1 2 2",
  className: "absolute inset-0 h-full w-full",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LayerSvg({ layer }: { layer: Layer }) {
  const body = layer.round
    ? `${circle([0, 0], layer.round.outer)}${layer.round.inner ? circle([0, 0], layer.round.inner) : ""}`
    : layer.hole
      ? `${toPath(layer.outline)}${toPath([...layer.hole].reverse())}`
      : toPath(layer.outline);
  return (
    <>
      <path d={body} fill="var(--realm-surface)" fillRule="evenodd" stroke="currentColor" strokeWidth={STROKE.main} />
      {layer.strokes.map((s, i) => (
        <path key={i} d={s.d} fill="none" strokeWidth={s.fine ? STROKE.fine : STROKE.main} />
      ))}
    </>
  );
}

/** The engraved labels, positioned in percent and sized in container units. */
export function LayerText({ layer }: { layer: Layer }) {
  return layer.texts.map((t, i) => (
    <span
      key={i}
      className={`pointer-events-none absolute leading-none whitespace-nowrap ${t.font === "display" ? "font-display" : "font-body"}`}
      style={{
        left: `${((t.x + 1) * 50).toFixed(3)}%`,
        top: `${((t.y + 1) * 50).toFixed(3)}%`,
        fontSize: `${(t.size * 50).toFixed(3)}cqw`,
        transform: `translate(-50%, -50%) rotate(${t.rotate.toFixed(2)}deg)`,
      }}
    >
      {t.text}
    </span>
  ));
}

/** One part: line work plus labels, turned as a single compositor layer. */
export function LayerPart({
  layer,
  style,
  ref,
  children,
}: {
  layer: Layer;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
  children?: React.ReactNode;
}) {
  return (
    <div ref={ref} className="absolute inset-0" style={style}>
      <svg {...svgProps}>
        <LayerSvg layer={layer} />
        {children}
      </svg>
      <LayerText layer={layer} />
    </div>
  );
}

/**
 * A ring's resting angle and, if it drifts, a compositor-only CSS animation
 * (see astrolabe-turn in globals.css). Reduced motion stops it in CSS.
 */
export function ringAnimation(start: number, speed: number): CSSProperties {
  return {
    transform: `rotate(${start}deg)`,
    willChange: "transform",
    ...(speed
      ? ({
          "--start": `${start}deg`,
          animation: `astrolabe-turn ${Math.abs(360 / speed).toFixed(1)}s linear infinite ${speed < 0 ? "reverse" : "normal"}`,
        } as CSSProperties)
      : {}),
  };
}

/**
 * The wrapper establishes the container that label sizes are relative to,
 * and clips the turned layers: a square rotated 45 degrees overhangs its box
 * (the corners hold nothing), and that overhang must not widen the page.
 */
export const astrolabeContainer: CSSProperties = { containerType: "inline-size", overflow: "clip" };
