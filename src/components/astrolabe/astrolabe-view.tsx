"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AstrolabeSvg } from "./astrolabe-svg";
import type { ChannelId, Mechanism } from "./mechanism";
import type { AstrolabeModel, Highlight } from "./model";

const Scene = dynamic(() => import("./scene").then((m) => m.Scene), { ssr: false });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

const INTERACTIONS = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

/**
 * Draws the SVG astrolabe straight away, then, where WebGL works, loads the
 * brass scene and fades it in once its first frame is ready.
 *
 * - "now": load at once (the finder, where the instrument is the page).
 * - "interaction": wait for the visitor's first pointer, key, touch or scroll
 *   (the home page), so the hero text paints first and nothing heavy runs
 *   in the background of a page nobody is using yet.
 */
export function AstrolabeView({
  model,
  mech,
  highlights,
  webgl,
  drift,
  tilt = false,
  reduced,
  onLoad3d,
}: {
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  webgl: "now" | "interaction";
  /** Idle ring speeds for the SVG, in degrees per second. */
  drift?: Partial<Record<ChannelId, number>>;
  /** Show the instrument at an angle, as on the home page. */
  tilt?: boolean;
  reduced: boolean;
  /** Called as the WebGL scene starts loading, to hand motion over to it. */
  onLoad3d?: () => void;
}) {
  const [load3d, setLoad3d] = useState(false);
  const [ready, setReady] = useState(false);
  // On the home page the canvas bleeds past the instrument to make room for smoke.
  const bleed = tilt && !reduced ? 0.22 : 0;

  useEffect(() => {
    if (!webglAvailable()) return;
    const start = () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
      onLoad3d?.();
      setLoad3d(true);
    };
    if (webgl === "now") {
      const id = setTimeout(start, 0);
      return () => clearTimeout(id);
    }
    for (const e of INTERACTIONS) window.addEventListener(e, start, { passive: true, once: true });
    return () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
    };
  }, [webgl, onLoad3d]);

  return (
    <div className="absolute inset-0 text-realm-accent">
      <AstrolabeSvg
        model={model}
        mech={mech}
        highlights={highlights}
        drift={drift}
        paused={ready}
        className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {load3d && (
        <div
          className={`absolute transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ inset: `${-bleed * 100}%` }}
        >
          <Scene
            model={model}
            mech={mech}
            highlights={highlights}
            tilt={tilt}
            reduced={reduced}
            onReady={() => setReady(true)}
            onFail={() => setLoad3d(false)}
            bleed={bleed}
          />
        </div>
      )}
    </div>
  );
}
