"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { driveAngle, structureState } from "@/lib/choreography";
import { smoother, span, stage } from "@/lib/sequence";
import { stageStore } from "@/lib/stage-store";
import { FLORALS } from "../../stations";
import { brassOnce, carved, stone, tile, water } from "../materials";
import { Pin, StationFrame } from "./frame";

const { size: SIZE, n: N } = FLORALS;
const T = SIZE / N;
const isBasin = (i: number, j: number) => (i === 2 || i === 3) && (j === 2 || j === 3);
const tileCentre = (i: number) => -SIZE / 2 + T / 2 + i * T;

/** A panel with a horseshoe arch cut through it: the arc closes in a little past the semicircle. */
function archGeometry(w: number, h: number) {
  const s = new THREE.Shape([
    new THREE.Vector2(-w / 2, 0),
    new THREE.Vector2(w / 2, 0),
    new THREE.Vector2(w / 2, h),
    new THREE.Vector2(-w / 2, h),
  ]);
  const r = w * 0.34;
  const cy = h * 0.6;
  const hole = new THREE.Path();
  // a true horseshoe: the arc runs 25 degrees past the semicircle on each side
  const a0 = (-25 * Math.PI) / 180;
  const a1 = (205 * Math.PI) / 180;
  const foot = 0.07;
  hole.moveTo(r * Math.cos(a1), foot);
  hole.lineTo(r * Math.cos(a1), cy + r * Math.sin(a1));
  // over the top, from 240 down to -60 degrees: a 300 degree horseshoe
  hole.absarc(0, cy, r, a1, a0, true);
  hole.lineTo(r * Math.cos(a0), foot);
  hole.lineTo(r * Math.cos(a1), foot);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 24 });
  g.translate(0, 0, -0.035);
  return g;
}

/** A petal: a rounded blade standing on its base at the local origin, facing +z. */
function petalGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.09, 0.03, 0.1, 0.17, 0, 0.22);
  s.bezierCurveTo(-0.1, 0.17, -0.09, 0.03, 0, 0);
  return new THREE.ShapeGeometry(s, 12);
}

type Arch = { pos: [number, number, number]; yaw: number; delay: number };
const ARCHES: Arch[] = [
  ...[-0.8, 0, 0.8].map((x, i) => ({ pos: [x, 0, -SIZE / 2] as [number, number, number], yaw: 0, delay: 1 + Math.abs(i - 1) })),
  ...[-0.6, 0.6].map((z) => ({ pos: [-SIZE / 2, 0, z] as [number, number, number], yaw: Math.PI / 2, delay: 3 })),
  ...[-0.6, 0.6].map((z) => ({ pos: [SIZE / 2, 0, z] as [number, number, number], yaw: -Math.PI / 2, delay: 3 })),
];

/**
 * The Still-Water Garden: a camshaft under the courtyard flips its tiles
 * over on their pivots, row by row, to show glazed faces; the centre tiles
 * screw down into a basin; horseshoe arches unfold up on base hinges; the
 * basin fills; a bloom opens on the water.
 */
export function Florals() {
  const tiles = useRef<THREE.InstancedMesh>(null);
  const cams = useRef<(THREE.Group | null)[]>([]);
  const arches = useRef<(THREE.Group | null)[]>([]);
  const waterRef = useRef<THREE.Mesh>(null);
  const bloom = useRef<THREE.Group>(null);
  const petals = useRef<(THREE.Group | null)[]>([]);

  const geo = useMemo(() => ({ tile: new THREE.BoxGeometry(T - 0.012, 0.04, T - 0.012), arch: archGeometry(0.76, 1.0), petal: petalGeometry() }), []);
  // box faces: +x, -x, +y (engraved brass, the plate's face), -y (glazed tile), +z, -z
  const tileMats = useMemo(() => {
    const b = brassOnce("#b58f55");
    return [b, b, b, tile(), b, b];
  }, []);
  const mats = useMemo(() => ({ carved: carved(), stone: stone("#6f6a62"), brass: brassOnce("#9c7a45") }), []);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const xAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  useLayoutEffect(() => {
    tiles.current!.count = N * N;
  }, []);

  useFrame(() => {
    const p = stageStore.getState().progress;
    const s = structureState("florals", p);
    const flip = span(s, 0, 0.42);
    const lower = smoother(span(s, 0.32, 0.46));
    const fill = smoother(span(s, 0.58, 0.8));
    const open = smoother(span(s, 0.8, 1));
    // tiles: each row flips half a turn about its pivot, back row first
    let k = 0;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        if (isBasin(i, j)) {
          q.identity();
          // basin tiles keep their brass face up and are screwed down
          v.set(tileCentre(i), -0.02 - 0.22 * lower, tileCentre(j));
        } else {
          const a = Math.PI * smoother(stage(flip, j, N, 0.55));
          q.setFromAxisAngle(xAxis, a);
          v.set(tileCentre(i), -0.02, tileCentre(j));
        }
        m.compose(v, q, one);
        tiles.current!.setMatrixAt(k++, m);
      }
    }
    tiles.current!.instanceMatrix.needsUpdate = true;
    // the camshafts beneath turn with the drive whenever the floor is moving
    const drive = driveAngle(p);
    cams.current.forEach((c) => c && (c.rotation.x = drive * 0.5));
    // arches: each unfolds from flat (outside the courtyard) to upright, one after another
    const rise = span(s, 0.36, 0.78);
    ARCHES.forEach((a, i) => {
      const g = arches.current[i];
      if (g) g.rotation.x = -(Math.PI / 2) * (1 - smoother(stage(rise, a.delay - 1, 3, 0.4)));
    });
    // water fills the basin; the bloom floats up with it and opens
    if (waterRef.current) {
      waterRef.current.visible = fill > 0.001;
      waterRef.current.position.y = -0.24 + 0.19 * fill;
    }
    if (bloom.current) {
      bloom.current.visible = fill > 0.001;
      bloom.current.position.y = -0.24 + 0.19 * fill + 0.01;
    }
    // closed: cupped upright; open: each petal tips outward on its base
    petals.current.forEach((pt, i) => pt && (pt.rotation.x = 0.15 + (1.05 + (i % 2) * 0.15) * open));
  });

  return (
    <StationFrame id="florals">
      <instancedMesh ref={tiles} args={[geo.tile, tileMats, N * N]} castShadow receiveShadow />
      {/* pivots: a pin through every row of tiles */}
      {Array.from({ length: N }, (_, j) => (
        <Pin key={j} at={[0, -0.02, tileCentre(j)]} axis="x" length={SIZE + 0.06} r={0.012} />
      ))}
      {/* camshafts under the rows, glimpsed between turning tiles */}
      {Array.from({ length: N }, (_, j) => (
        <group key={j} ref={(el) => void (cams.current[j] = el)} position={[0, -0.32, tileCentre(j)]}>
          <mesh rotation-z={Math.PI / 2} material={mats.brass}>
            <cylinderGeometry args={[0.02, 0.02, SIZE, 8]} />
          </mesh>
          {Array.from({ length: N }, (_, i) => (
            <mesh key={i} position={[tileCentre(i), 0.03, 0]} rotation-z={Math.PI / 2} material={mats.brass}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the basin's walls, revealed as its floor screws down */}
      {[
        [0, -0.13, -T, 2 * T, 0.26, 0.02],
        [0, -0.13, T, 2 * T, 0.26, 0.02],
        [-T, -0.13, 0, 0.02, 0.26, 2 * T],
        [T, -0.13, 0, 0.02, 0.26, 2 * T],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} material={mats.stone} receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      <mesh ref={waterRef} rotation-x={-Math.PI / 2} material={water()} visible={false}>
        <planeGeometry args={[2 * T - 0.02, 2 * T - 0.02]} />
      </mesh>
      <group ref={bloom} visible={false}>
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} rotation-y={(i / 8) * Math.PI * 2}>
            <group ref={(el) => void (petals.current[i] = el)} position={[0, 0, 0.03]}>
              <mesh geometry={geo.petal} castShadow>
                <meshStandardMaterial color={i % 2 ? "#c27a72" : "#b5655f"} roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        ))}
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#d8b25a" roughness={0.5} />
        </mesh>
      </group>
      {/* arches, hinged at their base on the courtyard's edge */}
      {ARCHES.map((a, i) => (
        <group key={i} position={a.pos} rotation-y={a.yaw}>
          <group ref={(el) => void (arches.current[i] = el)}>
            <mesh geometry={geo.arch} material={mats.carved} castShadow receiveShadow />
          </group>
          <Pin at={[0, 0.01, 0]} axis="x" length={0.8} r={0.014} />
        </group>
      ))}
    </StationFrame>
  );
}
