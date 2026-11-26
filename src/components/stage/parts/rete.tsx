"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { leaf } from "@/components/flacon/kit";
import { reteAngle } from "@/lib/choreography";
import { stageStore } from "@/lib/stage-store";
import { canvasTexture, paintEngraving, readFonts, yieldToMain } from "../engrave";
import { wearMap } from "./materials";

export const RETE_Y = 1.8;
const OUT = [8.45, 9.4] as const;
const ECLIPTIC = { c: [0, -1.4] as [number, number], r: [5.85, 6.3] as const };
const rad = (d: number) => (d * Math.PI) / 180;

/** Ring shape centred at (cx, cy) in drawing units (y = world z). */
function ring(cx: number, cy: number, r0: number, r1: number) {
  const s = new THREE.Shape();
  s.absarc(cx, -cy, r1, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absarc(cx, -cy, r0, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

function bar(a: number, r0: number, r1: number, w: number) {
  const d = [Math.cos(rad(a)), Math.sin(rad(a))];
  const n = [-d[1], d[0]];
  const p = (r: number, s: number) => new THREE.Vector2(d[0] * r + n[0] * s, -(d[1] * r + n[1] * s));
  return new THREE.Shape([p(r0, -w), p(r1, -w), p(r1, w), p(r0, w)]);
}

/** A star pointer: a flame-shaped blade, as on a rete, pointing inward. */
function pointer(a: number) {
  const base: [number, number] = [OUT[0] * Math.cos(rad(a)), OUT[0] * Math.sin(rad(a))];
  const outline = leaf(base, a + 180, 1.55, 0.22, { veins: 0, midrib: false })[0].d;
  const pts = outline.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const v: THREE.Vector2[] = [];
  // the leaf path is M p C c1 c2 p C c1 c2 p: sample its cubic curves
  const P = (i: number) => new THREE.Vector2(pts[i], -pts[i + 1]);
  const c1 = new THREE.CubicBezierCurve(P(0), P(2), P(4), P(6));
  const c2 = new THREE.CubicBezierCurve(P(6), P(8), P(10), P(12));
  v.push(...c1.getPoints(10), ...c2.getPoints(10).slice(1));
  return new THREE.Shape(v);
}

/**
 * The rete: an openwork brass frame above the plate. Its outer band carries
 * the family names, as the finder's does; the gaps between its bars are what
 * the camera descends through.
 */
export function Rete({ labels, textureSize }: { labels: string[]; textureSize: number }) {
  const geometry = useMemo(() => {
    const shapes = [ring(0, 0, OUT[0], OUT[1]), ring(ECLIPTIC.c[0], ECLIPTIC.c[1], ECLIPTIC.r[0], ECLIPTIC.r[1])];
    for (let k = 0; k < 4; k++) shapes.push(bar(45 + k * 90, 5.2, OUT[0] + 0.1, 0.16));
    for (let k = 0; k < 8; k++) shapes.push(pointer(22.5 + k * 45));
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
      curveSegments: 96,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await yieldToMain();
      const fonts = readFonts();
      await document.fonts.load(`48px ${fonts.display}`, labels.join("")).catch(() => undefined);
      const mid = (OUT[0] + OUT[1]) / 2;
      const { color } = paintEngraving({
        size: textureSize,
        extent: 9.6,
        strokes: [],
        texts: labels.map((text, i) => {
          const a = -90 + i * 90;
          return { text, x: mid * Math.cos(rad(a)), y: mid * Math.sin(rad(a)), rotate: a + 90, size: 0.62, font: "display" as const };
        }),
        fonts,
        base: "#c49f62",
        ink: "#2a1c0b",
        line: 0.03,
        seed: 9,
      });
      if (cancelled) return;
      setMap(canvasTexture(color, { srgb: true, extent: 9.6 }));
    })();
    return () => {
      cancelled = true;
    };
  }, [labels, textureSize]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        color: map ? "#ffffff" : "#c49f62",
        metalness: 1,
        roughness: 1,
        roughnessMap: wearMap(),
      }),
    [map],
  );

  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = -reteAngle(stageStore.getState().progress);
  });

  return <mesh ref={ref} geometry={geometry} material={material} position={[0, RETE_Y, 0]} castShadow receiveShadow />;
}
