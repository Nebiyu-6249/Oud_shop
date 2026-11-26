// Paints engraving onto canvases for the stage's materials. Everything is
// procedural: line work comes from the same path kit as the flacons and the
// astrolabe, and the wear is value noise.

import * as THREE from "three";
import type { Stroke } from "@/components/flacon/kit";

export type EngraveText = { text: string; x: number; y: number; rotate: number; size: number; font: "display" | "body" };

export type Fonts = { display: string; body: string; dir: CanvasDirection };

export function readFonts(): Fonts {
  const cs = getComputedStyle(document.documentElement);
  return {
    display: cs.getPropertyValue("--font-display-face").trim() || "serif",
    body: cs.getPropertyValue("--font-body-face").trim() || "serif",
    dir: document.documentElement.dir === "rtl" ? "rtl" : "ltr",
  };
}

/** Deterministic pseudo-random, so the wear is identical on every load. */
export function rand(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Engraving on brass. The canvas spans [-extent, extent] in drawing units
 * (x right, y down). Returns colour and groove canvases: the groove canvas is
 * white with dark cuts, for the bump map.
 */
export function paintEngraving(opts: {
  size: number;
  extent: number;
  strokes: (Stroke & { tf?: [number, number, number] })[];
  texts?: EngraveText[];
  fonts?: Fonts;
  base: string;
  ink: string;
  line: number;
  seed: number;
  lathe?: boolean;
}) {
  const { size, extent, strokes, texts = [], fonts, base, ink, line, seed, lathe = true } = opts;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    return [c, c.getContext("2d")!] as const;
  };
  const [color, cc] = make();
  const [groove, gc] = make();
  const k = size / (2 * extent);
  cc.fillStyle = base;
  cc.fillRect(0, 0, size, size);
  gc.fillStyle = "#ffffff";
  gc.fillRect(0, 0, size, size);

  for (const [ctx, ink2] of [
    [cc, ink],
    [gc, "#000000"],
  ] as const) {
    ctx.setTransform(k, 0, 0, k, size / 2, size / 2);
    if (lathe && ctx === cc) {
      const r = rand(seed);
      for (let i = 0; i < 320; i++) {
        ctx.strokeStyle = r() > 0.5 ? "rgba(255,236,200,0.05)" : "rgba(40,25,8,0.06)";
        ctx.lineWidth = (0.6 + r() * 2) / k;
        ctx.beginPath();
        ctx.arc(0, 0, r() * extent, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = ink2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      if (s.tf) {
        ctx.save();
        ctx.translate(s.tf[0], s.tf[1]);
        ctx.scale(s.tf[2], s.tf[2]);
        ctx.lineWidth = (s.fine ? line * 0.45 : line) / s.tf[2];
        ctx.stroke(new Path2D(s.d));
        ctx.restore();
      } else {
        ctx.lineWidth = s.fine ? line * 0.45 : line;
        ctx.stroke(new Path2D(s.d));
      }
    }
    if (fonts) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = ink2;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = fonts.dir;
      for (const t of texts) {
        ctx.save();
        ctx.translate(size / 2 + t.x * k, size / 2 + t.y * k);
        ctx.rotate((t.rotate * Math.PI) / 180);
        ctx.font = `${Math.round(t.size * k)}px ${t.font === "display" ? fonts.display : fonts.body}`;
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      }
    }
  }
  return { color, groove };
}

/** Value-noise wear for roughness: worn (smoother) patches and fine scratches. */
export function paintWear(size: number, seed: number, mean = 0.42, spread = 0.18) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const r = rand(seed);
  const g = Math.round(mean * 255);
  ctx.fillStyle = `rgb(${g},${g},${g})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const v = Math.round((mean + (r() - 0.5) * 2 * spread) * 255);
    const rad = (0.01 + r() * 0.08) * size;
    ctx.fillStyle = `rgba(${v},${v},${v},0.08)`;
    ctx.beginPath();
    ctx.arc(r() * size, r() * size, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < 500; i++) {
    const v = Math.round((mean - spread) * 255);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.25)`;
    const x = r() * size;
    const y = r() * size;
    const a = r() * Math.PI * 2;
    const l = (0.01 + r() * 0.05) * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  return c;
}

export function canvasTexture(c: HTMLCanvasElement, opts: { srgb?: boolean; repeat?: number; extent?: number } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat, opts.repeat);
  }
  if (opts.extent) {
    // caps of shapes built in drawing units: uv = (x, y), so map [-e, e] to [0, 1]
    t.repeat.set(1 / (2 * opts.extent), 1 / (2 * opts.extent));
    t.offset.set(0.5, 0.5);
  }
  t.anisotropy = 8;
  return t;
}

export const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
