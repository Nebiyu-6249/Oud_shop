"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { cameraAt, stationCenter, structureState, type StationId, PLATE_R } from "@/lib/choreography";
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
  useFrame(({ camera, gl }) => {
    cameraAt(stageStore.getState().progress, pose);
    camera.position.copy(pose.pos);
    camera.lookAt(pose.look);
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

export function Scene() {
  return (
    <>
      <color attach="background" args={["#0d0a07"]} />
      <fog attach="fog" args={["#0d0a07", 18, 90]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-6, 10, 4]} intensity={2.2} />
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[PLATE_R, 128]} />
        <meshStandardMaterial color="#9c7b46" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[PLATE_R + 0.8, PLATE_R + 0.8, 1.4, 128, 1, true]} />
        <meshStandardMaterial color="#b08d57" metalness={0.6} roughness={0.4} side={2} />
      </mesh>
      <Placeholders />
      <CameraRig />
      <Invalidator />
    </>
  );
}
