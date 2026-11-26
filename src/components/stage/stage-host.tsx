"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { REALM_LABEL } from "@/lib/sequence";
import { type StageMode, stageStore } from "@/lib/stage-store";
import type { Palette } from "@/lib/palette";
import { useReducedMotion } from "@/components/astrolabe/use-reduced-motion";

const StageRuntime = dynamic(() => import("./stage-runtime").then((m) => m.StageRuntime), { ssr: false });

const INTERACTIONS = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Lives in the locale layout, so it survives every navigation. It tells the
 * stage what the current route wants, and loads the 3D runtime (a separate
 * chunk) only after the visitor first interacts: well after the hero text has
 * painted, and never on a page nobody is using. With ?debug it loads at once.
 */
export function StageHost({ familyLabels, realmPalettes }: { familyLabels: string[]; realmPalettes: Record<string, Palette> }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [load, setLoad] = useState(false);

  // mark the document once the visitor has navigated within the site
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.documentElement.dataset.navigated = "";
  }, [pathname]);

  useEffect(() => {
    const [, section, slug] = pathname.split("/");
    let mode: StageMode = "parked";
    let target = stageStore.getState().target;
    if (pathname === "/") mode = "scroll";
    else if (section === "finder") mode = "hidden";
    else if (section === "realms" && REALM_LABEL[slug]) target = REALM_LABEL[slug];
    else target = "ascent";
    stageStore.setState({ mode, target });
  }, [pathname]);

  useEffect(() => {
    stageStore.setState({ reduced });
  }, [reduced]);

  // phones and portrait screens: the compact camera path, and no tilt-shift to begin with
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (max-aspect-ratio: 9/10)");
    const apply = () => {
      const variant = mq.matches ? "compact" : "full";
      const s = stageStore.getState();
      stageStore.setState({ variant, ...(s.qualityPinned ? {} : { quality: variant === "compact" ? 2 : Math.max(s.quality, 2) as 2 | 3 }) });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!webglAvailable()) return;
    const params = new URLSearchParams(window.location.search);
    const debug = params.has("debug");
    stageStore.setState({ debug });
    // ?debug&quality=0..3 pins a quality level, for measuring each step on a real device
    const q = Number(params.get("quality"));
    if (debug && params.get("post") === "0") stageStore.setState({ postOff: true });
    if (debug && params.has("quality") && q >= 0 && q <= 3) stageStore.setState({ quality: q as 0 | 1 | 2 | 3, qualityPinned: true });
    const start = () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
      stageStore.setState({ live: true });
      setLoad(true);
    };
    if (debug) {
      start();
      return;
    }
    for (const e of INTERACTIONS) window.addEventListener(e, start, { passive: true, once: true });
    return () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
    };
  }, []);

  return load ? <StageRuntime familyLabels={familyLabels} realmPalettes={realmPalettes} /> : null;
}
