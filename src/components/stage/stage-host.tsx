"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { REALM_LABEL } from "@/lib/sequence";
import { type StageMode, stageStore } from "@/lib/stage-store";
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
export function StageHost({ familyLabels }: { familyLabels: string[] }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [load, setLoad] = useState(false);

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

  useEffect(() => {
    if (!webglAvailable()) return;
    const debug = new URLSearchParams(window.location.search).has("debug");
    stageStore.setState({ debug });
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

  return load ? <StageRuntime familyLabels={familyLabels} /> : null;
}
