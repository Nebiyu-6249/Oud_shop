// Shared procedural materials. Brass is fully metallic with roughness varied
// by painted wear, never glossy.

import * as THREE from "three";
import { canvasTexture, paintWear, rand } from "../engrave";

let wear: THREE.Texture | null = null;

/** One tiling wear map shared by every brass part. */
export function wearMap() {
  wear ??= canvasTexture(paintWear(512, 11), { repeat: 3 });
  return wear;
}

export function brass(color = "#b08d57", roughness = 1) {
  return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, roughnessMap: wearMap() });
}


function canvas(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  paint(c.getContext("2d")!, size);
  return c;
}

const cache = new Map<string, THREE.Material>();
const once = <T extends THREE.Material>(key: string, make: () => T): T => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
};

/** Dressed stone: mottled, with chisel marks. */
export function stone(tint = "#8a8478") {
  return once(`stone${tint}`, () => {
    const r = rand(21);
    const tex = canvasTexture(
      canvas(256, (ctx, s) => {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 1400; i++) {
          const v = 90 + r() * 80;
          ctx.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.05 + r() * 0.08})`;
          ctx.fillRect(r() * s, r() * s, 1 + r() * 6, 1 + r() * 3);
        }
        ctx.strokeStyle = "rgba(40,36,30,0.18)";
        for (let i = 0; i < 60; i++) {
          const x = r() * s;
          const y = r() * s;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 6 + r() * 10, y + (r() - 0.5) * 3);
          ctx.stroke();
        }
      }),
      { srgb: true, repeat: 2 },
    );
    return new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: 0.93, metalness: 0 });
  });
}

/** Carved wood with a long grain. */
export function wood(tint = "#6e4a2a") {
  return once(`wood${tint}`, () => {
    const r = rand(33);
    const tex = canvasTexture(
      canvas(256, (ctx, s) => {
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 90; i++) {
          const y = r() * s;
          const dark = r() > 0.5;
          ctx.strokeStyle = dark ? `rgba(30,18,8,${0.15 + r() * 0.2})` : `rgba(200,150,100,${0.06 + r() * 0.08})`;
          ctx.lineWidth = 0.5 + r() * 2;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= s; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 2.5);
          ctx.stroke();
        }
      }),
      { srgb: true, repeat: 1 },
    );
    return new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.8, roughness: 0.72, metalness: 0 });
  });
}

/** Dark tanned leather with a line of saddle stitching. */
export function leather() {
  return once("leather", () => {
    const r = rand(44);
    const tex = canvasTexture(
      canvas(256, (ctx, s) => {
        ctx.fillStyle = "#4a2b18";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 3000; i++) {
          ctx.fillStyle = r() > 0.5 ? "rgba(20,10,4,0.12)" : "rgba(120,80,50,0.07)";
          ctx.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
        }
        ctx.strokeStyle = "#c8a46a";
        ctx.lineWidth = 2;
        for (const y of [18, s - 18]) for (let x = 4; x < s; x += 14) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 7, y);
          ctx.stroke();
        }
      }),
      { srgb: true, repeat: 1 },
    );
    return new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.6, roughness: 0.78, metalness: 0 });
  });
}

/** Glazed tile: an eight-pointed star in turquoise on terracotta, cream lines between. */
export function tile() {
  return once("tile", () => {
    const tex = canvasTexture(
      canvas(256, (ctx, s) => {
        ctx.fillStyle = "#a95c3a";
        ctx.fillRect(0, 0, s, s);
        const c = s / 2;
        const star = (r: number, fill: string) => {
          ctx.beginPath();
          for (let i = 0; i < 16; i++) {
            const a = (i * Math.PI) / 8 - Math.PI / 2;
            const rr = i % 2 ? r * 0.55 : r;
            ctx.lineTo(c + rr * Math.cos(a), c + rr * Math.sin(a));
          }
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.strokeStyle = "#efe3c8";
          ctx.lineWidth = 5;
          ctx.stroke();
        };
        star(s * 0.46, "#2f8f86");
        star(s * 0.2, "#efe3c8");
        ctx.strokeStyle = "#efe3c8";
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, s - 6, s - 6);
      }),
      { srgb: true },
    );
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0 });
  });
}

/** Pale carved stone for the arches. */
export const carved = () => stone("#cdbd9c");

export function glass() {
  return once("glass", () => new THREE.MeshStandardMaterial({ color: "#cfe2dc", roughness: 0.08, metalness: 0, transparent: true, opacity: 0.38 }));
}

export function water() {
  return once("water", () => new THREE.MeshStandardMaterial({ color: "#0e3836", roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.92 }));
}

export function brassOnce(color = "#b08d57") {
  return once(`brass${color}`, () => brass(color));
}
