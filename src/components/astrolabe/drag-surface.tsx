"use client";

import { useRef, useState } from "react";
import { R, ringAt, type RingId } from "./geometry";
import type { Mechanism } from "./mechanism";

const deg = (x: number, y: number) => (Math.atan2(y, x) * 180) / Math.PI;

/**
 * An invisible disc over the rings that turns whichever ring the pointer
 * grabs. It covers only the rings, so touches on the rest of the page scroll.
 */
export function DragSurface({
  mech,
  onRelease,
}: {
  mech: Mechanism;
  onRelease: (ring: RingId, value: number) => void;
}) {
  const drag = useRef<{ ring: RingId; last: number; total: number; start: number; id: number } | null>(null);
  const [active, setActive] = useState<RingId | null>(null);

  const local = (e: React.PointerEvent) => {
    const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const half = box.width / 2;
    return {
      x: (e.clientX - box.left - half) / half,
      y: (e.clientY - box.top - box.height / 2) / half,
    };
  };

  const inset = `${((1 - R.reteOuter - 0.02) * 50).toFixed(3)}%`;

  return (
    <div
      aria-hidden
      className="absolute rounded-full"
      style={{
        inset,
        touchAction: "none",
        cursor: active ? "grabbing" : "grab",
      }}
      onPointerDown={(e) => {
        const { x, y } = local(e);
        const ring = ringAt(Math.hypot(x, y));
        if (!ring) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { ring, last: deg(x, y), total: 0, start: mech.channels[ring].value, id: e.pointerId };
        setActive(ring);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const { x, y } = local(e);
        const a = deg(x, y);
        let delta = a - d.last;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        d.last = a;
        d.total += delta;
        mech.channels[d.ring].set(d.start + d.total);
        mech.wake();
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        setActive(null);
        onRelease(d.ring, mech.channels[d.ring].value);
      }}
      onPointerCancel={(e) => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        setActive(null);
        onRelease(d.ring, mech.channels[d.ring].value);
        void e;
      }}
    />
  );
}
