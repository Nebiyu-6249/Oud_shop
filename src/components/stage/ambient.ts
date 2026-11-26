import { stageStore } from "@/lib/stage-store";

/**
 * Time for ambient life only (smoke drifting, embers flickering, dust): never
 * for mechanisms, which follow progress alone. Frozen at 0 until the visitor
 * interacts, and always under reduced motion.
 */
export function ambientTime(elapsed: number): number {
  const s = stageStore.getState();
  return s.live && !s.reduced ? elapsed : 0;
}
