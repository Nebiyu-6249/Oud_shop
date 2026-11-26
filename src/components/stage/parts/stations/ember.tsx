"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { structureState } from "@/lib/choreography";
import { clamp01, smoother, span } from "@/lib/sequence";
import { stageStore } from "@/lib/stage-store";
import { rand } from "../../engrave";
import { EMBER, ratchetPhase } from "../../stations";
import { ambientTime } from "../../ambient";
import { brassOnce } from "../materials";
import { StationFrame } from "./frame";

const RINGS = EMBER.rings;
/** Height each ring rests at once lifted: wider rings higher, a stepped bowl. */
const RING_Y = [0.22, 0.3, 0.41, 0.55, 0.72];
const LEG_H = 0.9;
const rad = (d: number) => (d * Math.PI) / 180;

function ringGeometry(r0: number, r1: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, 0, Math.PI * 2, false);
  if (r0 > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, r0, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 48 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.05, 0);
  return g;
}

/** The brazier's light, and the glow it lends the embers: read by the lamp in step 6. */
export const emberGlow = { value: 0 };

/**
 * The Ember Kiln: three legs rise through the plate, then the medallion's
 * concentric rings lift one by one on spokes that ride up the legs,
 * stacking into a stepped brass bowl. Embers kindle in it and become the
 * scene's light; saffron threads drift up from the heat.
 */
export function Ember() {
  const legs = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useRef<(THREE.Group | null)[]>([]);
  const embers = useRef<THREE.InstancedMesh>(null);
  const threads = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const emberMat = useRef<THREE.MeshStandardMaterial>(null);

  const geo = useMemo(
    () => ({
      rings: RINGS.map((r1, i) => ringGeometry(i === 0 ? 0 : RINGS[i - 1] + 0.004, r1)),
      ember: new THREE.IcosahedronGeometry(0.035, 0),
      thread: new THREE.BoxGeometry(0.006, 0.09, 0.006),
    }),
    [],
  );
  const brass = useMemo(() => brassOnce("#b0874c"), []);
  const dark = useMemo(() => brassOnce("#6e5130"), []);

  // ember and thread placements are fixed; only their glow and drift change
  const layout = useMemo(() => {
    const r = rand(77);
    const embersAt = Array.from({ length: 42 }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.5;
      const ring = RINGS.findIndex((x) => d <= x);
      return [Math.cos(a) * d, RING_Y[Math.max(0, ring)] + 0.02 + r() * 0.05, Math.sin(a) * d, r() * 6.28] as const;
    });
    const threadsAt = Array.from({ length: 26 }, () => [r() * Math.PI * 2, 0.1 + r() * 0.35, r(), r() * 6.28] as const);
    return { embersAt, threadsAt };
  }, []);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    embers.current!.count = layout.embersAt.length;
    threads.current!.count = layout.threadsAt.length;
  }, [layout]);

  useFrame(({ clock }) => {
    const s = structureState("ember", stageStore.getState().progress);
    const t = ambientTime(clock.getElapsedTime());
    // 1. legs rise through their holes
    const legUp = smoother(span(s, 0, 0.2));
    legs.current.forEach((l) => l && (l.position.y = -LEG_H / 2 - 0.05 + (LEG_H + 0.05) * legUp));
    // 2. rings lift one ratchet stage each, centre first, riding up the legs on their spokes
    const r = ratchetPhase(span(s, 0.18, 0.72), RINGS.length);
    const u = r.value * RINGS.length;
    rings.current.forEach((g, i) => g && (g.position.y = RING_Y[i] * smoother(clamp01(u - i))));
    // 3. embers kindle; the brazier's light grows with them
    const glow = smoother(span(s, 0.7, 0.9));
    emberGlow.value = glow;
    layout.embersAt.forEach(([x, y, z, ph], i) => {
      const flicker = 0.75 + 0.25 * Math.sin(t * 3 + ph);
      v.set(x, y, z);
      e.set(ph, ph * 1.7, 0);
      q.setFromEuler(e);
      const k = glow > 0.001 ? 0.6 + 0.4 * flicker : 0.0001;
      sc.set(k, k, k);
      m.compose(v, q, sc);
      embers.current!.setMatrixAt(i, m);
    });
    embers.current!.instanceMatrix.needsUpdate = true;
    if (emberMat.current) emberMat.current.emissiveIntensity = glow * (1.6 + 0.4 * Math.sin(t * 2.1));
    if (light.current) light.current.intensity = glow * (5.5 + 0.6 * Math.sin(t * 2.7));
    // 4. saffron threads drift up out of the heat, turning as they go
    const drift = span(s, 0.84, 1);
    layout.threadsAt.forEach(([a, rr, seed, ph], i) => {
      const climb = (seed + t * 0.05 + drift * 0.3) % 1;
      const y = 0.8 + climb * 1.3;
      const ang = a + climb * 2.5;
      v.set(Math.cos(ang) * (rr + climb * 0.25), y, Math.sin(ang) * (rr + climb * 0.25));
      e.set(ph + t * 0.6, ph, ph * 0.5);
      q.setFromEuler(e);
      const k = drift > 0.001 ? drift * (1 - climb * 0.6) : 0.0001;
      sc.set(k, k, k);
      m.compose(v, q, sc);
      threads.current!.setMatrixAt(i, m);
    });
    threads.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <StationFrame id="ember">
      {EMBER.legs.map((a, i) => {
        const x = EMBER.legR * Math.cos(rad(a));
        const z = EMBER.legR * Math.sin(rad(a));
        return (
          <mesh key={i} ref={(el) => void (legs.current[i] = el)} position={[x, -LEG_H / 2 - 0.05, z]} material={dark} castShadow>
            <cylinderGeometry args={[0.035, 0.035, LEG_H, 10]} />
          </mesh>
        );
      })}
      {geo.rings.map((g, i) => (
        <group key={i} ref={(el) => void (rings.current[i] = el)}>
          <mesh geometry={g} material={brass} castShadow receiveShadow />
          {/* spokes reaching the legs, with a collar that slides up each one */}
          {i > 0 &&
            EMBER.legs.map((a, j) => {
              const r0 = RINGS[i];
              const r1 = EMBER.legR;
              const mid = (r0 + r1) / 2;
              return (
                <group key={j} rotation-y={-rad(a)}>
                  <mesh position={[mid, -0.025, 0]} material={dark} castShadow>
                    <boxGeometry args={[r1 - r0, 0.02, 0.025]} />
                  </mesh>
                  <mesh position={[r1, -0.025, 0]} material={dark}>
                    <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
                  </mesh>
                </group>
              );
            })}
        </group>
      ))}
      <instancedMesh ref={embers} args={[geo.ember, undefined, 42]}>
        <meshStandardMaterial ref={emberMat} color="#4a1608" emissive="#ff5a1f" emissiveIntensity={0} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={threads} args={[geo.thread, undefined, 26]}>
        <meshStandardMaterial color="#c8361a" emissive="#7a1a08" emissiveIntensity={0.6} roughness={0.7} />
      </instancedMesh>
      <pointLight ref={light} position={[0, 0.6, 0]} color="#ff8a40" intensity={0} distance={7} decay={2} />
    </StationFrame>
  );
}
