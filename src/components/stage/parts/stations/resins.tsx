"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { structureState } from "@/lib/choreography";
import { clamp01, smoother, span } from "@/lib/sequence";
import { stageStore } from "@/lib/stage-store";
import { RESINS, ratchetPhase } from "../../stations";
import { brassOnce, stone } from "../materials";
import { Smoke } from "../smoke";
import { Pin, StationFrame } from "./frame";

const { hatchR: HR, tiers: TIERS, tierH: H, wheel: W } = RESINS;
const tierR = (k: number) => 0.52 - k * 0.1;

/** A half-disc trapdoor, built with its hinge on the local origin. */
function doorGeometry(side: -1 | 1) {
  const s = new THREE.Shape();
  // the half from the hinge line (x = 0) to the centre line (x = HR * -side)
  s.absarc(-side * HR, 0, HR, side > 0 ? Math.PI / 2 : -Math.PI / 2, side > 0 ? (3 * Math.PI) / 2 : Math.PI / 2, false);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 32 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.05, 0);
  return g;
}

/** A ratchet wheel: twelve sawtooth teeth that a pawl can only let turn one way. */
function ratchetWheelGeometry() {
  const n = 12;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    pts.push(new THREE.Vector2(Math.cos(a0) * W.r * 0.78, Math.sin(a0) * W.r * 0.78));
    pts.push(new THREE.Vector2(Math.cos(a1 - 0.02) * W.r, Math.sin(a1 - 0.02) * W.r));
  }
  const s = new THREE.Shape(pts);
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.04, 0, Math.PI * 2, true);
  s.holes.push(bore);
  return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
}

function censerGeometry() {
  const bowl = new THREE.LatheGeometry(
    [
      [0.05, 0],
      [0.16, 0.02],
      [0.2, 0.1],
      [0.21, 0.16],
      [0.19, 0.18],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    24,
  );
  const lid = new THREE.LatheGeometry(
    [
      [0.205, 0],
      [0.2, 0.06],
      [0.14, 0.14],
      [0.05, 0.19],
      [0.03, 0.24],
      [0.0, 0.25],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    24,
  );
  return { bowl, lid };
}

/**
 * The Frost Cloister: trapdoors drop open on their hinges, a stepped stone
 * incense tower telescopes up one ratchet stage at a time (the ratchet
 * wheel and its pawl turn beside the hatch, its shaft running into the
 * hatch), the censer lid hinges back and smoke rises.
 */
export function Resins() {
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const tiers = useRef<(THREE.Group | null)[]>([]);
  const wheel = useRef<THREE.Mesh>(null);
  const pawl = useRef<THREE.Group>(null);
  const censer = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const smoke = useRef(0);

  const geo = useMemo(
    () => ({
      doorL: doorGeometry(-1),
      doorR: doorGeometry(1),
      wheel: ratchetWheelGeometry(),
      tiers: Array.from({ length: TIERS }, (_, k) => {
        const g = new THREE.CylinderGeometry(tierR(k), tierR(k) + 0.02, H - 0.04, 8);
        g.translate(0, (H - 0.04) / 2, 0);
        return g;
      }),
      cornice: Array.from({ length: TIERS }, (_, k) => new THREE.CylinderGeometry(tierR(k) + 0.045, tierR(k) + 0.045, 0.04, 8)),
      ...censerGeometry(),
    }),
    [],
  );
  const mat = useMemo(() => ({ stone: stone("#8b8a86"), brass: brassOnce("#b8955c"), dark: brassOnce("#7d5f34") }), []);

  useFrame(() => {
    const s = structureState("resins", stageStore.getState().progress);
    // 1. the hatch: both trapdoors swing down into the plate
    const hatch = smoother(span(s, 0, 0.16));
    if (doorL.current) doorL.current.rotation.z = -hatch * 1.85;
    if (doorR.current) doorR.current.rotation.z = hatch * 1.85;
    // 2. the tower: four ratchet stages, each tier telescoping out of the last
    const r = ratchetPhase(span(s, 0.14, 0.78), TIERS);
    const u = r.value * TIERS;
    // each tier rides on the one below it: a running sum of their extensions
    // the first tier starts deep enough to hide the censer below the closed hatch
    const DROP = H + 0.48;
    let y = -DROP + DROP * clamp01(u);
    for (let k = 0; k < TIERS; k++) {
      if (k > 0) y += H * clamp01(u - k);
      const tier = tiers.current[k];
      if (tier) tier.position.y = y;
    }
    if (censer.current) censer.current.position.y = y + H;
    // the ratchet wheel turns three teeth per stage; the pawl lifts and drops over each
    if (wheel.current) wheel.current.rotation.z = -r.value * Math.PI * 2;
    if (pawl.current) pawl.current.rotation.z = 0.32 * Math.sin(Math.PI * ((r.moving * 3) % 1));
    // 3. the lid hinges back, 4. smoke rises
    if (lid.current) lid.current.rotation.x = -smoother(span(s, 0.8, 0.92)) * 1.95;
    smoke.current = span(s, 0.86, 1);
  });

  return (
    <StationFrame id="resins">
      {/* trapdoors, hinged on pins at either side of the hatch */}
      <group ref={doorL} position={[-HR, 0, 0]}>
        <mesh geometry={geo.doorL} material={mat.brass} castShadow receiveShadow />
      </group>
      <group ref={doorR} position={[HR, 0, 0]}>
        <mesh geometry={geo.doorR} material={mat.brass} castShadow receiveShadow />
      </group>
      <Pin at={[-HR, 0.01, 0]} axis="z" length={HR * 1.5} />
      <Pin at={[HR, 0.01, 0]} axis="z" length={HR * 1.5} />

      {/* the telescoping tower, a cornice on every tier */}
      {geo.tiers.map((g, k) => (
        <group key={k} ref={(el) => void (tiers.current[k] = el)} position={[0, -H - 0.48, 0]}>
          <mesh geometry={g} material={mat.stone} castShadow receiveShadow />
          <mesh geometry={geo.cornice[k]} material={mat.stone} position={[0, H - 0.02, 0]} castShadow receiveShadow />
        </group>
      ))}

      {/* the censer on the top tier, its lid hinged at the back */}
      <group ref={censer} position={[0, -0.48, 0]}>
        <mesh geometry={geo.bowl} material={mat.brass} castShadow />
        <group ref={lid} position={[0, 0.18, -0.2]}>
          <mesh geometry={geo.lid} material={mat.brass} position={[0, 0, 0.2]} castShadow />
        </group>
        <Pin at={[0, 0.18, -0.2]} axis="x" length={0.12} r={0.012} />
        <group position={[0, 0.2, 0]}>
          <Smoke amount={() => smoke.current} height={1.7} width={0.8} />
        </group>
      </group>

      {/* the drive: ratchet wheel on its post, a pawl riding its teeth, a shaft into the hatch */}
      <group position={[W.x, W.r + 0.06, W.z]}>
        <mesh ref={wheel} geometry={geo.wheel} material={mat.brass} position={[0, 0, -0.025]} castShadow />
        <group ref={pawl} position={[-0.02, W.r + 0.08, 0.03]}>
          <mesh position={[-0.12, -0.03, 0]} rotation-z={-0.35} castShadow>
            <boxGeometry args={[0.26, 0.035, 0.03]} />
            <meshStandardMaterial color="#8a6a3a" metalness={1} roughness={0.4} />
          </mesh>
        </group>
        <Pin at={[-0.02, W.r + 0.08, 0.03]} axis="z" length={0.08} r={0.015} />
        <Pin at={[0, 0, 0]} axis="z" length={0.14} r={0.03} />
      </group>
      <mesh position={[W.x, 0.15, W.z]} material={mat.dark} castShadow>
        <boxGeometry args={[0.08, 0.3, 0.06]} />
      </mesh>
      <Pin at={[(HR + W.x) / 2, W.r + 0.06, W.z]} axis="x" length={W.x - HR + 0.05} r={0.022} />
      <mesh position={[HR + 0.04, W.r * 0.55, W.z]} material={mat.dark} castShadow>
        <boxGeometry args={[0.12, W.r * 1.1 + 0.12, 0.12]} />
      </mesh>
    </StationFrame>
  );
}
