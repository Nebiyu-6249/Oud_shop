"use client";

import { Canvas } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { FOV } from "@/lib/choreography";
import { createMasterTimeline, labelAt } from "@/lib/sequence";
import { stageStore, useStage } from "@/lib/stage-store";
import { DebugOverlay } from "./debug-overlay";
import { attachKeys, attachSnap, buildOverlayTimeline } from "./sequence-controls";
import { Scene } from "./scene";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** The overlay timeline for the current home page, if any; scrubbed with the master. */
let overlay: gsap.core.Timeline | null = null;

/** Publishes progress to the store (for the canvas) and to CSS (for DOM overlays). */
function publish(p: number) {
  stageStore.setState({ progress: p });
  overlay?.progress(p);
  document.documentElement.style.setProperty("--p", p.toFixed(5));
}

/**
 * The 3D stage. Mounted once from the layout and never unmounted, so the
 * canvas survives every navigation. Owns smooth scrolling (Lenis, driven by
 * the GSAP ticker) and the master timeline.
 */
export function StageRuntime({ familyLabels }: { familyLabels: string[] }) {
  const mode = useStage((s) => s.mode);
  const target = useStage((s) => s.target);
  const ready = useStage((s) => s.ready);
  const debug = useStage((s) => s.debug);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Let the DOM know when the first frame is on screen (the poster fades).
  useEffect(() => {
    document.documentElement.dataset.stage = ready ? "ready" : "loading";
  }, [ready]);

  // Smooth scroll and the master timeline, once for the life of the page.
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09 });
    lenisRef.current = lenis;
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    tl.current = createMasterTimeline(gsap, publish);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      tl.current?.kill();
    };
  }, []);

  // The home page scrubs the timeline; other routes park it at their label.
  useEffect(() => {
    const timeline = tl.current;
    if (!timeline) return;
    if (mode !== "scroll") {
      timeline.progress(labelAt(target));
      return;
    }
    let trigger: ScrollTrigger | undefined;
    let raf = 0;
    const cleanups: (() => void)[] = [];
    const reduced = () => stageStore.getState().reduced;
    const attach = () => {
      const el = document.getElementById("sequence");
      const lenis = lenisRef.current;
      if (!el || !lenis) {
        raf = requestAnimationFrame(attach);
        return;
      }
      if (!reduced()) {
        const o = buildOverlayTimeline(gsap, SplitText, el);
        overlay = o.timeline;
        cleanups.push(() => {
          overlay = null;
          o.revert();
        });
      }
      trigger = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        animation: timeline,
        scrub: true,
      });
      overlay?.progress(timeline.progress());
      cleanups.push(attachSnap(lenis, trigger, reduced), attachKeys(lenis, trigger, reduced));
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      trigger?.kill();
      for (const c of cleanups) c();
    };
  }, [mode, target]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{ opacity: ready && mode !== "hidden" ? 1 : 0 }}
    >
      <Canvas
        frameloop={mode === "hidden" ? "never" : "demand"}
        dpr={[1, 1.5]}
        camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 52, 0.8] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => requestAnimationFrame(() => requestAnimationFrame(() => stageStore.setState({ ready: true })))}
      >
        <Scene familyLabels={familyLabels} />
      </Canvas>
      {debug && <DebugOverlay />}
    </div>
  );
}
