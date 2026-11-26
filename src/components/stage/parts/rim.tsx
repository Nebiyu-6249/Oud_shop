"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { R, kursiRight, rule as ruleLayer } from "@/components/astrolabe/geometry";
import { PLATE_R, rimAngle, ruleAngle } from "@/lib/choreography";
import { stageStore } from "@/lib/stage-store";
import { canvasTexture, yieldToMain } from "../engrave";
import { RIM_H, STRIP_REPEAT, STRIP_W, rimStrip } from "../rim-design";
import { brassOnce, wearMap } from "./materials";

const BOTTOM = -0.15;
const THICK = 0.6;

/** Paints the relief strip: raised line work catching light above a shadowed edge. */
function paintRelief(width: number) {
  const height = Math.round((width * RIM_H) / STRIP_W);
  const k = width / STRIP_W;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return [c, c.getContext("2d")!] as const;
  };
  const [color, cc] = make();
  const [bump, bc] = make();
  cc.fillStyle = "#a9864f";
  cc.fillRect(0, 0, width, height);
  bc.fillStyle = "#6a6a6a";
  bc.fillRect(0, 0, width, height);
  const strokes = rimStrip();
  const pass = (ctx: CanvasRenderingContext2D, style: string, lw: number, dx: number, dy: number) => {
    ctx.strokeStyle = style;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      ctx.setTransform(k, 0, 0, k, dx, dy);
      if (s.tf) {
        ctx.translate(s.tf[0], s.tf[1]);
        ctx.scale(s.tf[2], s.tf[2]);
      }
      const scale = s.tf ? s.tf[2] : 1;
      ctx.lineWidth = (s.fine ? lw * 0.5 : lw) / scale;
      ctx.stroke(new Path2D(s.d));
    }
  };
  // a dark offset under each line, then the raised line itself: embossed, not cut
  pass(cc, "rgba(40,26,10,0.7)", 0.02, 2, 3);
  pass(cc, "#dcbb7e", 0.017, 0, 0);
  pass(bc, "#ffffff", 0.024, 0, 0);
  return { color, bump };
}

/**
 * The instrument's outer band: a brass wall round the plate, its inner face
 * carrying the house's story in relief, turning slowly in the Rim. The
 * throne (kursi) lies flat beyond it at the north, and the rule rides above
 * the rete.
 */
export function Rim({ textureWidth }: { textureWidth: number }) {
  const band = useRef<THREE.Group>(null);
  const ruleRef = useRef<THREE.Mesh>(null);
  const [maps, setMaps] = useState<{ color: THREE.Texture; bump: THREE.Texture } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await yieldToMain();
      const { color, bump } = paintRelief(textureWidth);
      if (cancelled) return;
      const wrap = (t: THREE.Texture) => {
        t.wrapS = THREE.RepeatWrapping;
        // seen from inside the drum; a negative repeat keeps the reliefs unmirrored
        t.repeat.set(-STRIP_REPEAT, 1);
        return t;
      };
      setMaps({ color: wrap(canvasTexture(color, { srgb: true })), bump: wrap(canvasTexture(bump)) });
    })();
    return () => {
      cancelled = true;
    };
  }, [textureWidth]);

  const geo = useMemo(() => {
    const inner = new THREE.CylinderGeometry(PLATE_R, PLATE_R, RIM_H, 256, 1, true);
    const outer = new THREE.CylinderGeometry(PLATE_R + THICK, PLATE_R + THICK, RIM_H, 256, 1, true);
    const topShape = new THREE.Shape();
    topShape.absarc(0, 0, PLATE_R + THICK, 0, Math.PI * 2, false);
    const h = new THREE.Path();
    h.absarc(0, 0, PLATE_R, 0, Math.PI * 2, true);
    topShape.holes.push(h);
    const top = new THREE.ShapeGeometry(topShape, 128);
    top.rotateX(-Math.PI / 2);
    // the throne, lying flat at the north, scaled from the finder's instrument
    const S = PLATE_R / R.limbOuter;
    const right = kursiRight().map(([x, y]) => new THREE.Vector2(x * S, -y * S));
    const outline = [...right.map((v) => new THREE.Vector2(-v.x, v.y)).reverse(), ...right];
    const kursiShape = new THREE.Shape(outline);
    const shackle = new THREE.Path();
    shackle.absarc(0, 0.955 * S, 0.22, 0, Math.PI * 2, true);
    kursiShape.holes.push(shackle);
    const kursi = new THREE.ExtrudeGeometry(kursiShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    kursi.rotateX(-Math.PI / 2);
    // the rule, scaled up from the finder's
    const ruleShape = new THREE.Shape(ruleLayer().outline.map(([x, y]) => new THREE.Vector2(x * S, -y * S)));
    const rule = new THREE.ExtrudeGeometry(ruleShape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 });
    rule.rotateX(-Math.PI / 2);
    return { inner, outer, top, kursi, rule };
  }, []);

  const relief = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: maps?.color ?? null,
        bumpMap: maps?.bump ?? null,
        bumpScale: 4,
        color: maps ? "#ffffff" : "#a9864f",
        metalness: 1,
        roughness: 1,
        roughnessMap: wearMap(),
        side: THREE.BackSide,
      }),
    [maps],
  );
  const plain = useMemo(() => brassOnce("#a8854c"), []);

  useFrame(() => {
    const p = stageStore.getState().progress;
    if (band.current) band.current.rotation.y = -rimAngle(p);
    if (ruleRef.current) ruleRef.current.rotation.y = -ruleAngle(p);
  });

  return (
    <>
      <group ref={band}>
        <mesh geometry={geo.inner} material={relief} position={[0, BOTTOM + RIM_H / 2, 0]} receiveShadow />
        <mesh geometry={geo.outer} material={plain} position={[0, BOTTOM + RIM_H / 2, 0]} />
        <mesh geometry={geo.top} material={plain} position={[0, BOTTOM + RIM_H, 0]} receiveShadow />
      </group>
      <mesh geometry={geo.kursi} material={plain} position={[0, BOTTOM + RIM_H - 0.16, 0]} castShadow receiveShadow />
      <mesh ref={ruleRef} geometry={geo.rule} material={plain} position={[0, 2.02, 0]} castShadow receiveShadow />
    </>
  );
}
