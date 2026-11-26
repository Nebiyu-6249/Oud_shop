"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { driveAngle, structureState } from "@/lib/choreography";
import { pitchRadius, rootRadius, toothOutline } from "@/lib/gears";
import { smoother, span, stage } from "@/lib/sequence";
import { stageStore } from "@/lib/stage-store";
import { WOODS } from "../../stations";
import { brassOnce, glass, leather, wood } from "../materials";
import { Pin, StationFrame } from "./frame";

const SLAT_H = 1.3;
const { centreX: CX, span: SPAN, lift: L } = WOODS;

/** Dune profiles for the back and front rows of slats. */
const dune = (row: number, x: number) =>
  row === 0
    ? 0.34 + 0.5 * Math.exp(-(((x - 0.15) / 0.55) ** 2)) + 0.08 * Math.sin(5 * x)
    : 0.16 + 0.3 * Math.exp(-(((x + 0.55) / 0.45) ** 2)) + 0.05 * Math.sin(7 * x + 1);

// the lift: a pinion rides up a fixed rack; its turn is height over pitch radius
const PINION = { teeth: 14, module: 0.03 };
const RP = pitchRadius(PINION);
const LIFT_LOW = -0.62;
const LIFT_HIGH = 0.3;
const RACK_X = L.x + L.size / 2 + 0.04 + RP;

function flaconGeometry() {
  const body = new THREE.LatheGeometry(
    [
      [0.0, 0],
      [0.13, 0.0],
      [0.16, 0.06],
      [0.17, 0.2],
      [0.15, 0.32],
      [0.08, 0.38],
      [0.05, 0.4],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    28,
  );
  const wrap = new THREE.CylinderGeometry(0.175, 0.172, 0.2, 28, 1, true);
  wrap.translate(0, 0.17, 0);
  const neck = new THREE.CylinderGeometry(0.04, 0.045, 0.08, 16);
  neck.translate(0, 0.44, 0);
  const cap = new THREE.CylinderGeometry(0.055, 0.05, 0.08, 16);
  cap.translate(0, 0.52, 0);
  return { body, wrap, neck, cap };
}

/**
 * The Caravanserai: two rows of wooden slats rise through their slots, each
 * pushed by a cam on a shaft below, into dune profiles; beside them a
 * leather-wrapped flacon rises on a platform whose pinion climbs a fixed
 * rack.
 */
export function Woods() {
  const slats = useRef<THREE.InstancedMesh>(null);
  const cams = useRef<(THREE.Group | null)[]>([]);
  const platform = useRef<THREE.Group>(null);
  const pinion = useRef<THREE.Group>(null);

  const rows = WOODS.rows;
  const total = rows.reduce((n, r) => n + r.n, 0);
  const geo = useMemo(() => {
    const pinionTooth = new THREE.ExtrudeGeometry(new THREE.Shape(toothOutline(PINION).map(([x, y]) => new THREE.Vector2(x, y))), {
      depth: 0.04,
      bevelEnabled: false,
    });
    const rackTooth = new THREE.BoxGeometry(PINION.module * 2.2, PINION.module * 1.2, 0.04);
    return {
      slat: new THREE.BoxGeometry(0.055, SLAT_H, 0.28),
      pinionTooth,
      pinionBody: new THREE.CylinderGeometry(rootRadius(PINION), rootRadius(PINION), 0.04, 24),
      rackTooth,
      ...flaconGeometry(),
    };
  }, []);
  const mats = useMemo(() => ({ wood: wood("#7a5232"), brass: brassOnce("#a9844b"), dark: brassOnce("#6e5130") }), []);

  const pinionTeeth = useRef<THREE.InstancedMesh>(null);
  const rackTeeth = useRef<THREE.InstancedMesh>(null);
  const RACK_N = 34;
  const rackPitch = Math.PI * PINION.module;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let k = 0; k < PINION.teeth; k++) pinionTeeth.current!.setMatrixAt(k, m.makeRotationZ((k / PINION.teeth) * Math.PI * 2));
    pinionTeeth.current!.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < RACK_N; k++) rackTeeth.current!.setMatrixAt(k, m.makeTranslation(0, -0.9 + k * rackPitch, 0));
    rackTeeth.current!.instanceMatrix.needsUpdate = true;
  }, [rackPitch]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame(() => {
    const p = stageStore.getState().progress;
    const s = structureState("woods", p);
    const slide = span(s, 0, 0.68);
    let k = 0;
    rows.forEach((row, ri) => {
      for (let i = 0; i < row.n; i++) {
        const x = CX - SPAN / 2 + (SPAN * i) / (row.n - 1);
        // a wave across the row, back row leading
        const rise = smoother(stage(slide, i, row.n, 0.8));
        const top = -0.02 + (dune(ri, x - CX) + 0.02) * rise * (ri === 0 ? 1 : 0.999);
        v.set(x, top - SLAT_H / 2, row.z);
        m.compose(v, q, one);
        slats.current!.setMatrixAt(k++, m);
      }
    });
    slats.current!.instanceMatrix.needsUpdate = true;
    const drive = driveAngle(p);
    cams.current.forEach((c) => c && (c.rotation.x = drive * 0.4));
    // the lift: height from progress, pinion turn exactly height over pitch radius
    const h = LIFT_LOW + (LIFT_HIGH - LIFT_LOW) * smoother(span(s, 0.5, 1));
    if (platform.current) platform.current.position.y = h;
    if (pinion.current) pinion.current.rotation.z = -(h - LIFT_LOW) / RP;
  });

  return (
    <StationFrame id="woods">
      <instancedMesh ref={slats} args={[geo.slat, mats.wood, total]} castShadow receiveShadow />
      {/* a camshaft under each row, glimpsed through the slots */}
      {rows.map((row, i) => (
        <group key={i} ref={(el) => void (cams.current[i] = el)} position={[CX, -0.75, row.z]}>
          <mesh rotation-z={Math.PI / 2} material={mats.brass}>
            <cylinderGeometry args={[0.025, 0.025, SPAN + 0.2, 8]} />
          </mesh>
          {Array.from({ length: row.n }, (_, j) => (
            <mesh key={j} position={[-SPAN / 2 + (SPAN * j) / (row.n - 1), 0.04, 0]} rotation-z={Math.PI / 2} material={mats.brass}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 10]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the lift: platform, column, flacon, and the pinion that climbs the rack */}
      <group ref={platform} position={[L.x, LIFT_LOW, L.z]}>
        <mesh position={[0, -0.02, 0]} material={mats.brass} castShadow receiveShadow>
          <boxGeometry args={[L.size, 0.04, L.size]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} material={mats.dark}>
          <boxGeometry args={[0.12, 1.16, 0.12]} />
        </mesh>
        <group position={[0, 0, 0]}>
          <mesh geometry={geo.body} material={glass()} />
          <mesh geometry={geo.wrap} material={leather()} castShadow />
          <mesh geometry={geo.neck} material={glass()} />
          <mesh geometry={geo.cap} material={mats.brass} castShadow />
        </group>
        {/* the pinion rides on the platform's arm, meshing with the rack */}
        <mesh position={[(RACK_X - L.x) / 2 + 0.02, -0.06, 0]} material={mats.dark}>
          <boxGeometry args={[RACK_X - L.x - 0.02, 0.03, 0.03]} />
        </mesh>
        <group ref={pinion} position={[RACK_X - L.x - RP, -0.06, 0.05]}>
          <mesh geometry={geo.pinionBody} material={mats.brass} rotation-x={Math.PI / 2} position={[0, 0, 0.02]} />
          <instancedMesh ref={pinionTeeth} args={[geo.pinionTooth, mats.brass, PINION.teeth]} castShadow />
        </group>
        <Pin at={[RACK_X - L.x - RP, -0.06, 0.05]} axis="z" length={0.12} r={0.015} />
      </group>
      {/* the fixed rack: a bar standing beside the lift, its teeth facing the pinion */}
      <group position={[RACK_X, 0, L.z + 0.07]}>
        <mesh position={[0.03, -0.2, 0]} material={mats.dark} castShadow>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
        </mesh>
        <instancedMesh ref={rackTeeth} args={[geo.rackTooth, mats.dark, RACK_N]} castShadow />
      </group>
    </StationFrame>
  );
}
