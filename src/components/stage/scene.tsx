"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import { cameraAt, stationCenter, structureState, type StationId, PLATE_R } from "@/lib/choreography";
import { Gearworks } from "./parts/gears";
import { Plate } from "./parts/plate";
import { Rete } from "./parts/rete";
import { stageStore } from "@/lib/stage-store";
import { frameStats } from "./frame-stats";

/** Re-render whenever progress or mode changes; nothing draws otherwise. */
function Invalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => stageStore.subscribe(() => invalidate()), [invalidate]);
  return null;
}

function CameraRig() {
  const pose = useMemo(() => cameraAt(0), []);
  useFrame(({ camera, gl, size }) => {
    cameraAt(stageStore.getState().progress, pose);
    camera.position.copy(pose.pos);
    camera.lookAt(pose.look);
    if (stageStore.getState().debug) {
      (window as unknown as { __stage: unknown }).__stage = {
        pos: camera.position.toArray(),
        progress: stageStore.getState().progress,
        quat: camera.quaternion.toArray(),
        aspect: (camera as import("three").PerspectiveCamera).aspect,
        size: [size.width, size.height],
      };
    }
    frameStats.frames++;
    frameStats.calls = gl.info.render.calls;
    frameStats.triangles = gl.info.render.triangles;
    frameStats.dpr = gl.getPixelRatio();
  });
  return null;
}

const IDS: StationId[] = ["resins", "florals", "ember", "woods"];

/** Step 1 placeholders: a block per station that rises with its state. */
function Placeholders() {
  const centers = useMemo(() => IDS.map(stationCenter), []);
  const refs = useMemo(() => IDS.map(() => ({ current: null as THREE_Mesh | null })), []);
  useFrame(() => {
    const p = stageStore.getState().progress;
    IDS.forEach((id, i) => {
      const m = refs[i].current;
      if (!m) return;
      const s = structureState(id, p);
      m.scale.y = Math.max(0.001, s);
      m.position.y = (1.4 * s) / 2;
    });
  });
  return (
    <>
      {centers.map((c, i) => (
        <mesh key={IDS[i]} ref={(m) => void (refs[i].current = m)} position={[c.x, 0, c.z]}>
          <boxGeometry args={[1, 1.4, 1]} />
          <meshStandardMaterial color="#8a7a66" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}
type THREE_Mesh = import("three").Mesh;

export function Scene({ familyLabels }: { familyLabels: string[] }) {
  return (
    <>
      <color attach="background" args={["#0d0a07"]} />
      <fog attach="fog" args={["#0d0a07", 18, 90]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-6, 10, 4]} intensity={2.2} />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.4} position={[-4, 6, 3]} scale={[8, 3, 1]} color="#ffd6a0" />
        <Lightformer form="rect" intensity={0.4} position={[5, 2, -4]} scale={[6, 4, 1]} />
      </Environment>
      <Plate textureSize={2048} />
      <Gearworks />
      <Rete labels={familyLabels} textureSize={2048} />
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[PLATE_R + 0.02, PLATE_R + 0.02, 1.4, 160, 1, true]} />
        <meshStandardMaterial color="#b08d57" metalness={1} roughness={0.5} side={2} />
      </mesh>
      <Placeholders />
      <CameraRig />
      <Invalidator />
    </>
  );
}
