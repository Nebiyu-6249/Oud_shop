"use client";

import { useEffect, useMemo } from "react";
import { AstrolabeView } from "./astrolabe-view";
import { Mechanism } from "./mechanism";
import { type AstrolabeLabels, buildModel } from "./model";
import { useReducedMotion } from "./use-reduced-motion";

/** Degrees per second for each ring while idling: slow, and not in step. */
const DRIFT = { rete: 2.2, wear: -1.4, plate: 0.9, rule: -0.6 } as const;

/** The home-page astrolabe: no controls, turning slowly by itself. */
export function IdleAstrolabe({ labels }: { labels: AstrolabeLabels }) {
  const reduced = useReducedMotion();
  const model = useMemo(() => buildModel(labels), [labels]);
  const mech = useMemo(() => {
    const m = new Mechanism();
    m.channels.rete.value = -90;
    m.channels.wear.value = 0;
    m.channels.plate.value = -72;
    m.channels.rule.value = 35;
    return m;
  }, []);

  useEffect(() => {
    mech.setDrift(reduced ? { rete: 0, wear: 0, plate: 0, rule: 0 } : DRIFT);
  }, [mech, reduced]);

  return <AstrolabeView model={model} mech={mech} highlights={[]} webgl="idle" tilt reduced={reduced} />;
}
