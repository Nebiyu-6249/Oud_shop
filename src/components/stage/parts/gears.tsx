"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { driveAngle } from "@/lib/choreography";
import { type PlacedGear, type TrainGear, gearAngle, placeTrain, rootRadius, toothOutline } from "@/lib/gears";
import { stageStore } from "@/lib/stage-store";
import { WINDOWS } from "../plate-design";
import { brass } from "./materials";

const THICK = 0.05;

function gearBody(g: PlacedGear) {
  const rf = rootRadius(g);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rf, 0, Math.PI * 2, false);
  // a hub bore and lightening holes, so the turning reads at a glance
  const bore = new THREE.Path();
  bore.absarc(0, 0, Math.max(0.03, rf * 0.12), 0, Math.PI * 2, true);
  shape.holes.push(bore);
  if (g.teeth >= 18) {
    const n = g.teeth >= 30 ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const h = new THREE.Path();
      h.absarc(Math.cos(a) * rf * 0.58, Math.sin(a) * rf * 0.58, rf * 0.2, 0, Math.PI * 2, true);
      shape.holes.push(h);
    }
  }
  return new THREE.ExtrudeGeometry(shape, { depth: THICK, bevelEnabled: false, curveSegments: 32 });
}

function toothGeometry(g: PlacedGear) {
  const shape = new THREE.Shape(toothOutline(g).map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(shape, { depth: THICK, bevelEnabled: false });
}

/** One gear: a body and its teeth, the teeth as a single instanced mesh. */
function Gear({ gear, material, groupRef }: { gear: PlacedGear; material: THREE.Material; groupRef: (g: THREE.Group | null) => void }) {
  const body = useMemo(() => gearBody(gear), [gear]);
  const tooth = useMemo(() => toothGeometry(gear), [gear]);
  const teeth = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let k = 0; k < gear.teeth; k++) {
      m.makeRotationZ((k / gear.teeth) * Math.PI * 2);
      teeth.current!.setMatrixAt(k, m);
    }
    teeth.current!.instanceMatrix.needsUpdate = true;
  }, [gear]);
  return (
    <group position={[gear.x, gear.y, 0]}>
      <group ref={groupRef}>
        <mesh geometry={body} material={material} castShadow receiveShadow />
        <instancedMesh ref={teeth} args={[tooth, material, gear.teeth]} castShadow receiveShadow />
      </group>
    </group>
  );
}

/**
 * A train under one plate window. Plane coordinates (u, v) are world (x, -z):
 * the group is laid flat so gear rotation about its local z is a turn about
 * the vertical.
 */
function Train({ train, centre, depth, material }: { train: TrainGear[]; centre: [number, number]; depth: number; material: THREE.Material }) {
  const placed = useMemo(() => placeTrain(train, { x: centre[0], y: centre[1] }), [train, centre]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const drive = driveAngle(stageStore.getState().progress);
    placed.forEach((g, i) => {
      const grp = groups.current[i];
      if (grp) grp.rotation.z = gearAngle(g, drive);
    });
  });
  // compound gears share a shaft but sit at their own height on it
  const level = (g: PlacedGear) => (train.find((t) => t.id === g.id)?.link.kind === "shaft" ? -0.07 : 0);
  return (
    <group rotation-x={-Math.PI / 2} position={[0, depth, 0]}>
      {placed.map((g, i) => (
        <group key={g.id} position={[0, 0, level(g)]}>
          <Gear gear={g} material={material} groupRef={(r) => void (groups.current[i] = r)} />
        </group>
      ))}
    </group>
  );
}

const rad = (d: number) => (d * Math.PI) / 180;

function trainFor(tangent: number, variant: number): TrainGear[] {
  const m = 0.045;
  const t = rad(tangent);
  return [
    { id: "drive", teeth: 24 + variant * 4, module: m, link: { kind: "driver" } },
    { id: "a", teeth: 14, module: m, link: { kind: "mesh", parent: "drive", direction: t } },
    { id: "b", teeth: 30, module: m, link: { kind: "mesh", parent: "a", direction: t - 0.35 } },
    { id: "b2", teeth: 12, module: m, link: { kind: "shaft", parent: "b" } },
    { id: "c", teeth: 34, module: m, link: { kind: "mesh", parent: "b2", direction: t + Math.PI * 0.62 } },
    { id: "d", teeth: 16, module: m, link: { kind: "mesh", parent: "drive", direction: t + Math.PI } },
  ];
}

/** Gear trains turning beneath every window, all off the master drive shaft. */
export function Gearworks() {
  const material = useMemo(() => brass("#a07a42"), []);
  const trains = useMemo(
    () =>
      WINDOWS.map((w, i) => {
        const rm = (w.r0 + w.r1) / 2;
        // world (x, z) to plane (u, v) = (x, -z): a plate angle a becomes -a
        const centre: [number, number] = [rm * Math.cos(rad(w.angle)), -rm * Math.sin(rad(w.angle))];
        return { id: w.id, train: trainFor(-w.angle + 90, i % 3), centre };
      }),
    [],
  );
  return (
    <>
      {trains.map((t) => (
        <Train key={t.id} train={t.train} centre={t.centre} depth={-0.42} material={material} />
      ))}
    </>
  );
}
