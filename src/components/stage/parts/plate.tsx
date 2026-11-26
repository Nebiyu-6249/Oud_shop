"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { PLATE_R } from "@/lib/choreography";
import { canvasTexture, paintEngraving, yieldToMain } from "../engrave";
import { WINDOWS, plateEngraving, windowOutline } from "../plate-design";
import { stationHoles } from "../stations";
import { brass, wearMap } from "./materials";

export const PLATE_THICKNESS = 0.14;

/** The engraved plate, with windows cut through it, and the dark mater below. */
export function Plate({ textureSize }: { textureSize: number }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, PLATE_R, 0, Math.PI * 2, false);
    // drawing y is world z; the shape's y becomes -z after laying it flat
    const hole = (pts: [number, number][]) => {
      const v = pts.map(([x, y]) => new THREE.Vector2(x, -y));
      // holes must wind opposite to the outline
      if (THREE.ShapeUtils.isClockWise(v) === false) v.reverse();
      shape.holes.push(new THREE.Path(v));
    };
    for (const w of WINDOWS) hole(windowOutline(w) as [number, number][]);
    for (const h of stationHoles()) hole(h as [number, number][]);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: PLATE_THICKNESS,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      curveSegments: 96,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -PLATE_THICKNESS, 0);
    return g;
  }, []);

  const [maps, setMaps] = useState<{ color: THREE.Texture; groove: THREE.Texture } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await yieldToMain();
      const { color, groove } = paintEngraving({
        size: textureSize,
        extent: PLATE_R + 0.2,
        strokes: plateEngraving(),
        base: "#bf995c",
        ink: "#2a1c0b",
        line: 0.035,
        seed: 3,
      });
      if (cancelled) return;
      // cap UVs are the shape's (x, -z): north (-z) maps to the canvas's top row
      setMaps({
        color: canvasTexture(color, { srgb: true, extent: PLATE_R + 0.2 }),
        groove: canvasTexture(groove, { extent: PLATE_R + 0.2 }),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [textureSize]);

  const materials = useMemo(() => {
    const cap = new THREE.MeshStandardMaterial({
      map: maps?.color ?? null,
      bumpMap: maps?.groove ?? null,
      bumpScale: 2.5,
      metalness: 1,
      roughness: 1,
      roughnessMap: wearMap(),
      color: maps ? "#ffffff" : "#bf995c",
    });
    return [cap, brass("#9c7a45")];
  }, [maps]);

  return (
    <>
      <mesh geometry={geometry} material={materials} receiveShadow castShadow />
      {/* the mater: the instrument's dark back, so the windows look into its works */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.15, 0]} receiveShadow>
        <circleGeometry args={[PLATE_R, 96]} />
        <meshStandardMaterial color="#2a1f14" metalness={0.6} roughness={0.7} />
      </mesh>
    </>
  );
}
