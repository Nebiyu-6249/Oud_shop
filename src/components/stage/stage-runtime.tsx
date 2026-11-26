"use client";

import { Canvas } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { useEffect, useMemo, useRef } from "react";
import { beatPalettes, paletteAt } from "@/lib/grade";
import { type Palette, paletteStyle } from "@/lib/palette";
import { FOV } from "@/lib/choreography";
import { createMasterTimeline, labelAt, nearestLabel } from "@/lib/sequence";
import { stageStore, useStage } from "@/lib/stage-store";
import { DebugOverlay } from "./debug-overlay";
import { attachKeys, attachSnap, buildOverlayTimeline } from "./sequence-controls";
import { Scene } from "./scene";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** The overlay timeline for the current home page, if any; scrubbed with the master. */
let overlay: gsap.core.Timeline | null = null;
/** The grade to paint on the DOM while the home sequence scrubs; null elsewhere. */
let domGrade: Record<string, Palette> | null = null;

function paintGrade(p: number) {
  if (!domGrade) return;
  const style = paletteStyle(paletteAt(p, domGrade as never));
  for (const [k, v] of Object.entries(style)) document.documentElement.style.setProperty(k, v);
}

function clearGrade() {
  for (const k of ["--realm-base", "--realm-surface", "--realm-accent", "--realm-ink", "--realm-glow"]) {
    document.documentElement.style.removeProperty(k);
  }
}

/** The home page's beat overlays; the ones whose window holds progress are active. */
let beats: HTMLElement[] = [];

function markActive(p: number) {
  for (const b of beats) {
    const on = p >= Number(b.dataset.a) && p <= Number(b.dataset.b);
    if (on !== b.hasAttribute("data-active")) b.toggleAttribute("data-active", on);
  }
}

/**
 * Under reduced motion the home page shows only composed frames: whatever
 * the scroll, the stage holds the nearest beat (its mechanisms already in
 * their final position) and swaps frames through a brief dip, never a
 * camera flight.
 */
let stillLabel: number | null = null;
let stillTimer = 0;

function showStill(p: number) {
  const at = labelAt(nearestLabel(p));
  if (stillLabel === at) return;
  if (stillLabel === null) {
    stillLabel = at;
    stageStore.setState({ progress: at });
    return;
  }
  stillLabel = at;
  window.clearTimeout(stillTimer);
  stageStore.setState({ dip: true });
  stillTimer = window.setTimeout(() => {
    stageStore.setState({ progress: stillLabel ?? at, dip: false });
  }, 220);
}

/** Publishes progress to the store (for the canvas) and to CSS (for DOM overlays). */
function publish(p: number) {
  const s = stageStore.getState();
  if (s.reduced && s.mode === "scroll") showStill(p);
  else {
    stillLabel = null;
    stageStore.setState({ progress: p });
  }
  overlay?.progress(p);
  markActive(p);
  paintGrade(p);
  document.documentElement.style.setProperty("--p", p.toFixed(5));
}

/**
 * The 3D stage. Mounted once from the layout and never unmounted, so the
 * canvas survives every navigation. Owns smooth scrolling (Lenis, driven by
 * the GSAP ticker) and the master timeline.
 */
export function StageRuntime({ familyLabels, realmPalettes }: { familyLabels: string[]; realmPalettes: Record<string, Palette> }) {
  const palettes = useMemo(() => beatPalettes(realmPalettes), [realmPalettes]);
  const mode = useStage((s) => s.mode);
  const target = useStage((s) => s.target);
  const ready = useStage((s) => s.ready);
  const debug = useStage((s) => s.debug);
  const dip = useStage((s) => s.dip);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Let the DOM know when the first frame is on screen (the poster fades).
  useEffect(() => {
    document.documentElement.dataset.stage = ready ? "ready" : "loading";
  }, [ready]);

  // Smooth scroll and the master timeline, once for the life of the page.
  useEffect(() => {
    // smooth scrolling is itself motion: off under reduced motion
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: !stageStore.getState().reduced });
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

  // The home page scrubs the timeline; other routes travel to their label and park.
  useEffect(() => {
    const timeline = tl.current;
    if (!timeline || mode === "hidden") return;
    const reduced = () => stageStore.getState().reduced;
    const cleanups: (() => void)[] = [];

    /** Travel along the same timeline: from where it is now to `to`, at most 1.6 s. */
    const travel = (to: number, done?: () => void) => {
      const from = timeline.time();
      if (Math.abs(to - from) < 1e-4) {
        done?.();
        return;
      }
      if (reduced()) {
        // no camera flight: dip the stage out, cut to the frame, bring it back
        stageStore.setState({ dip: true });
        const id = window.setTimeout(() => {
          timeline.progress(to);
          stageStore.setState({ dip: false });
          done?.();
        }, 260);
        cleanups.push(() => window.clearTimeout(id));
        return;
      }
      // the brief allows 1.6 s; plan for 1.4 so a late frame never pushes it over
      const duration = Math.min(1.4, 0.5 + Math.abs(to - from) * 2.2);
      const started = performance.now();
      const tween = timeline.tweenFromTo(from, to, {
        duration,
        ease: "power3.inOut",
        onComplete: () => {
          if (stageStore.getState().debug) {
            const w = window as unknown as { __travels?: unknown[] };
            (w.__travels ??= []).push({ from, to, planned: duration, took: (performance.now() - started) / 1000 });
          }
          done?.();
        },
      });
      cleanups.push(() => {
        tween.kill();
      });
    };

    if (mode === "parked") {
      travel(labelAt(target));
      return () => cleanups.forEach((c) => c());
    }

    // scroll: glide to wherever the page's scroll position says, then hand over to the scrub
    let trigger: ScrollTrigger | undefined;
    let raf = 0;
    const attach = () => {
      const el = document.getElementById("sequence");
      const lenis = lenisRef.current;
      if (!el || !lenis) {
        raf = requestAnimationFrame(attach);
        return;
      }
      const start = el.offsetTop;
      const end = start + el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
      beats = [...el.querySelectorAll<HTMLElement>("[data-beat]")];
      domGrade = palettes;
      paintGrade(timeline.progress());
      cleanups.push(() => {
        beats = [];
        domGrade = null;
        clearGrade();
      });
      travel(scrolled, () => {
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
      });
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      trigger?.kill();
      cleanups.forEach((c) => c());
    };
  }, [mode, target, palettes]);

  return (
    <>
    {/* outside the canvas layer, so it sits above page content */}
    {debug && <DebugOverlay />}
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity ${dip ? "duration-200" : "duration-700"}`}
      style={{ opacity: ready && mode !== "hidden" && !dip ? 1 : 0 }}
    >
      <Canvas
        frameloop={mode === "hidden" ? "never" : "demand"}
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 52, 0.8] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => requestAnimationFrame(() => requestAnimationFrame(() => stageStore.setState({ ready: true })))}
      >
        <Scene familyLabels={familyLabels} palettes={palettes} />
      </Canvas>
    </div>
    </>
  );
}
