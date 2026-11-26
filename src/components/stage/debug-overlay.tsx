"use client";

import { useEffect, useState } from "react";
import { nearestLabel } from "@/lib/sequence";
import { stageStore } from "@/lib/stage-store";
import { frameStats } from "./frame-stats";

/**
 * ?debug: frames the stage actually drew per second (it renders on demand, so
 * this is 0 when nothing moves), the browser's own frame rate for comparison,
 * and the quality level, pixel ratio and draw calls.
 */
export function DebugOverlay() {
  const [text, setText] = useState("measuring");

  useEffect(() => {
    let raf = 0;
    let browserFrames = 0;
    let last = performance.now();
    let lastStage = frameStats.frames;
    let worst = Infinity;
    const tick = () => {
      browserFrames++;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const id = setInterval(() => {
      const now = performance.now();
      const secs = (now - last) / 1000;
      const stageFps = (frameStats.frames - lastStage) / secs;
      const pageFps = browserFrames / secs;
      if (stageFps > 1) worst = Math.min(worst, stageFps);
      const s = stageStore.getState();
      const travels = (window as unknown as { __travels?: { planned: number; took: number }[] }).__travels ?? [];
      const travel = travels[travels.length - 1];
      setText(
        [
          `stage ${stageFps.toFixed(0)} fps (lowest while drawing ${worst === Infinity ? "-" : worst.toFixed(0)})`,
          `page ${pageFps.toFixed(0)} fps`,
          `quality ${s.quality}  dpr ${frameStats.dpr.toFixed(2)}`,
          `calls ${frameStats.calls}  tris ${frameStats.triangles}`,
          `progress ${s.progress.toFixed(3)}  ${nearestLabel(s.progress)}  ${s.mode}${s.reduced ? "  reduced" : ""}`,
          `last route travel ${travel ? `${travel.took.toFixed(2)} s (planned ${travel.planned.toFixed(2)})` : "-"}`,
        ].join("\n"),
      );
      browserFrames = 0;
      lastStage = frameStats.frames;
      last = now;
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  return (
    <pre
      data-stage-debug
      className="pointer-events-none fixed end-2 bottom-2 z-50 border border-brass bg-night/90 px-3 py-2 font-mono text-xs leading-5 whitespace-pre text-parchment"
    >
      {text}
    </pre>
  );
}
