"use client";

import { useMemo, useState } from "react";
import { IDLE_DRIFT, IDLE_START } from "./astrolabe-static";
import { type ChannelId, Mechanism } from "./mechanism";
import { type AstrolabeLabels, buildModel } from "./model";
import { Scene } from "./scene";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * The home-page brass scene, loaded on first interaction. The mechanism
 * starts where the CSS animation has carried each ring since the page
 * loaded, so the cross-fade from SVG does not jump.
 */
export function IdleScene({
  labels,
  startedAt,
  onReady,
  onFail,
}: {
  labels: AstrolabeLabels;
  startedAt: number;
  onReady: () => void;
  onFail: () => void;
}) {
  const reduced = useReducedMotion();
  const model = useMemo(() => buildModel(labels), [labels]);
  const [mech] = useState(() => {
    const m = new Mechanism();
    // the CSS animations began when the page was parsed, close to time zero
    const elapsed = reduced ? 0 : startedAt / 1000;
    m.setPositions(
      Object.fromEntries(
        Object.entries(IDLE_START).map(([id, v]) => [id, v + IDLE_DRIFT[id as ChannelId] * elapsed]),
      ),
    );
    if (!reduced) m.setDrift(IDLE_DRIFT);
    return m;
  });
  const [ready, setReady] = useState(false);
  const bleed = reduced ? 0 : 0.22;

  return (
    <div
      className={`absolute transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      style={{ inset: `${-bleed * 100}%` }}
    >
      <Scene
        model={model}
        mech={mech}
        highlights={[]}
        tilt
        reduced={reduced}
        bleed={bleed}
        onReady={() => {
          setReady(true);
          onReady();
        }}
        onFail={onFail}
      />
    </div>
  );
}
