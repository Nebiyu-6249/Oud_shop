"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { AstrolabeLabels } from "./model";

const IdleScene = dynamic(() => import("./idle-scene").then((m) => m.IdleScene), { ssr: false });

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
 * Waits for the visitor's first pointer, key, touch or scroll, then loads
 * the brass scene over the server-rendered SVG and fades the SVG out. Until
 * then this is the only JavaScript the instrument costs.
 */
export function WebglUpgrade({ labels }: { labels: AstrolabeLabels }) {
  const host = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [since, setSince] = useState(0);

  useEffect(() => {
    if (!webglAvailable()) return;
    const start = () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
      setSince(performance.now());
      setLoad(true);
    };
    for (const e of INTERACTIONS) window.addEventListener(e, start, { passive: true, once: true });
    return () => {
      for (const e of INTERACTIONS) window.removeEventListener(e, start);
    };
  }, []);

  const mark = (state: "ready" | "failed") => {
    const parent = host.current?.parentElement;
    if (parent) parent.dataset.webgl = state;
  };

  return (
    <div ref={host} className="absolute inset-0">
      {load && <IdleScene labels={labels} startedAt={since} onReady={() => mark("ready")} onFail={() => setLoad(false)} />}
    </div>
  );
}
