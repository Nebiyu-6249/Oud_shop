"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AstrolabeSvg } from "./astrolabe-svg";
import type { Mechanism } from "./mechanism";
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

/**
 * Draws the SVG astrolabe straight away, then, where WebGL works, loads the
 * brass scene and swaps it in once its first frame is ready. "idle" waits for
 * the browser to be idle so the hero text paints first.
 */
export function AstrolabeView({
  model,
  mech,
  highlights,
  webgl,
  tilt = false,
  reduced,
}: {
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  webgl: "now" | "idle";
  /** Show the instrument at an angle, as on the home page. */
  tilt?: boolean;
  reduced: boolean;
}) {
  const [load3d, setLoad3d] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!webglAvailable()) return;
    const start = () => setLoad3d(true);
    if (webgl === "now") {
      const id = setTimeout(start, 0);
      return () => clearTimeout(id);
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 2500);
    return () => clearTimeout(id);
  }, [webgl]);

  return (
    <div className="absolute inset-0 text-realm-accent">
      <AstrolabeSvg
        model={model}
        mech={mech}
        highlights={highlights}
        paused={ready}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {load3d && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <Scene
            model={model}
            mech={mech}
            highlights={highlights}
            tilt={tilt}
            reduced={reduced}
            onReady={() => setReady(true)}
            onFail={() => setLoad3d(false)}
          />
        </div>
      )}
    </div>
  );
}
