// The idle astrolabe as plain server-rendered markup: no hydration, and its
// drift is a CSS animation run by the compositor.

import { LayerPart, astrolabeContainer, ringAnimation } from "./layer-svg";
import type { AstrolabeModel } from "./model";

export const IDLE_START = { rete: -90, wear: 0, plate: -72, rule: 35 } as const;
/** Degrees per second for each ring while idling: slow, and not in step. */
export const IDLE_DRIFT = { rete: 2.2, wear: -1.4, plate: 0.9, rule: -0.6 } as const;

export function AstrolabeStatic({ model, className }: { model: AstrolabeModel; className?: string }) {
  return (
    <div aria-hidden className={className} style={astrolabeContainer}>
      <LayerPart layer={model.mater} />
      {(["plate", "wear", "rete", "rule"] as const).map((id) => (
        <LayerPart key={id} layer={model[id]} style={ringAnimation(IDLE_START[id], IDLE_DRIFT[id])} />
      ))}
    </div>
  );
}
