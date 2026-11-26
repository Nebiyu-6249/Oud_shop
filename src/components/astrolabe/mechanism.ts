// Ring motion, independent of how the rings are drawn. Each channel holds an
// angle in degrees. Settling moves are slow at the start (the weight of brass)
// and stop with a small, damped clunk as the detent catches.

export type ChannelId = "rete" | "wear" | "plate" | "rule";

type Move = { to: number; duration: number };
type Active = Move & { from: number; start: number };

/** Ease-in-out cubic plus a short overshoot-and-return near the end. */
export function heavyEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const base = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const clunk = t > 0.82 ? 0.012 * Math.sin((Math.PI * (t - 0.82)) / 0.18) : 0;
  return base + clunk;
}

/** Duration in ms for a move of `deg` degrees: heavier for longer travel. */
export const moveDuration = (deg: number) => 520 + Math.min(Math.abs(deg), 270) * 4.2;

/** The equivalent of `target` (mod 360) nearest to `from`. */
export function nearestTurn(from: number, target: number): number {
  return target + 360 * Math.round((from - target) / 360);
}

export class Channel {
  value: number;
  private active: Active | null = null;
  private queue: Move[] = [];
  /** Degrees per second while idling; 0 when still. */
  drift = 0;

  constructor(value = 0) {
    this.value = value;
  }

  get moving() {
    return this.active !== null || this.queue.length > 0 || this.drift !== 0;
  }

  /** Follow a drag exactly. Cancels any settling move. */
  set(value: number) {
    this.active = null;
    this.queue = [];
    this.value = value;
  }

  /** Settle on `target` by the shortest way round. Instant when reduced. */
  settle(target: number, reduced: boolean) {
    this.queue = [];
    this.active = null;
    const to = nearestTurn(this.value, target);
    if (reduced) {
      this.value = to;
      return;
    }
    this.queue.push({ to, duration: moveDuration(to - this.value) });
  }

  /** Visit several targets in turn, ending on the last. */
  sweep(targets: number[], reduced: boolean) {
    this.queue = [];
    this.active = null;
    if (targets.length === 0) return;
    if (reduced) {
      this.value = nearestTurn(this.value, targets[targets.length - 1]);
      return;
    }
    let from = this.value;
    for (const t of targets) {
      const to = nearestTurn(from, t);
      this.queue.push({ to, duration: moveDuration(to - from) * 0.8 });
      from = to;
    }
  }

  step(now: number, dt: number) {
    if (!this.active && this.queue.length) {
      const next = this.queue.shift()!;
      this.active = { ...next, from: this.value, start: now };
    }
    if (this.active) {
      const t = (now - this.active.start) / this.active.duration;
      this.value = this.active.from + (this.active.to - this.active.from) * heavyEase(Math.min(1, t));
      if (t >= 1) {
        this.value = this.active.to;
        this.active = null;
      }
    } else if (this.drift) {
      this.value += (this.drift * dt) / 1000;
    }
  }
}

export class Mechanism {
  readonly channels: Record<ChannelId, Channel> = {
    rete: new Channel(),
    wear: new Channel(),
    plate: new Channel(),
    rule: new Channel(),
  };
  private listeners = new Set<() => void>();
  private last = 0;

  get moving() {
    return Object.values(this.channels).some((c) => c.moving);
  }

  /** Renderers call this once per frame. */
  step(now: number) {
    const dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    for (const c of Object.values(this.channels)) c.step(now, dt);
  }

  /** Jump channels to angles, e.g. to take over from a CSS animation. */
  setPositions(angles: Partial<Record<ChannelId, number>>) {
    for (const [id, v] of Object.entries(angles)) if (v !== undefined) this.channels[id as ChannelId].set(v);
  }

  /** Set each channel's idle drift in degrees per second (0 to stop). */
  setDrift(speeds: Partial<Record<ChannelId, number>>) {
    for (const [id, v] of Object.entries(speeds)) this.channels[id as ChannelId].drift = v ?? 0;
    this.wake();
  }

  /** Notify renderers that something started moving. */
  wake() {
    this.last = 0;
    for (const l of this.listeners) l();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
