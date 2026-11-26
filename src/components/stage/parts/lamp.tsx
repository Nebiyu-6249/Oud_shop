"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraAt } from "@/lib/choreography";
import { lampAt } from "@/lib/grade";
import { stageStore } from "@/lib/stage-store";
import { emberGlow } from "./stations/ember";

const UP = new THREE.Vector3(0, 1, 0);

/** The lamp's height above its subject: about 2 units at the stations, rising with the camera for wide shots. */
export const lampHeight = (pos: THREE.Vector3, look: THREE.Vector3) => Math.max(2.1, 0.45 * pos.distanceTo(look));

/** Where the lamp hangs for a camera pose: above the subject, a little to the left and toward the lens. */
export function lampPosition(pos: THREE.Vector3, look: THREE.Vector3, out: THREE.Vector3) {
  const dir = look.clone().sub(pos).normalize();
  const right = dir.clone().cross(UP);
  if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
  right.normalize();
  const flat = dir.clone().setY(0);
  if (flat.lengthSq() > 1e-4) flat.normalize();
  // for wide shots the lantern also swings off the lens axis, so polished brass
  // does not mirror it straight back into the camera
  const h = lampHeight(pos, look);
  const side = Math.max(1.25, 0.42 * h);
  return out.copy(look).addScaledVector(UP, h).addScaledVector(right, -side).addScaledVector(flat, -0.7).add(new THREE.Vector3(0, 0, h > 3 ? 0.25 * h : 0));
}

/**
 * The single key light: a brass lantern with a glowing core, carried above
 * each subject. At the stations it hangs just above the frame; in the wide
 * shots it can be seen. Its colour temperature follows the grade, and in the
 * Ember beat it dims as the brazier takes over.
 */
export function Lamp({ shadows }: { shadows: boolean }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const pose = useMemo(() => cameraAt(0), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const p = stageStore.getState().progress;
    cameraAt(p, pose, stageStore.getState().variant);
    lampPosition(pose.pos, pose.look, at);
    const lamp = lampAt(p);
    color.set(lamp.color);
    // in the Ember beat the brazier is the key; the lamp yields to it
    const strength = lamp.strength * (1 - 0.7 * emberGlow.value);
    group.current?.position.copy(at);
    target.position.copy(pose.look);
    target.updateMatrixWorld();
    if (light.current) {
      light.current.color.copy(color);
      // keep the light on the subject constant as the lamp rises: intensity grows with height squared
      const h = lampHeight(pose.pos, pose.look);
      light.current.intensity = 160 * strength * (h / 2.1) ** 2 * (h > 3 ? 0.6 : 1);
    }
    if (core.current) {
      core.current.emissive.copy(color);
      core.current.emissiveIntensity = 2.2 * strength + 0.2;
    }
  });

  return (
    <>
      <primitive object={target} />
      <group ref={group}>
        {/* the lantern: a cap, a base and four posts round a glowing glass core */}
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.11, 0.1, 8]} />
          <meshStandardMaterial color="#a8834a" metalness={1} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 8]} />
          <meshStandardMaterial color="#a8834a" metalness={1} roughness={0.4} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0.08 * Math.cos((i * Math.PI) / 2 + 0.78), 0.02, 0.08 * Math.sin((i * Math.PI) / 2 + 0.78)]}>
            <cylinderGeometry args={[0.008, 0.008, 0.26, 6]} />
            <meshStandardMaterial color="#a8834a" metalness={1} roughness={0.4} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshStandardMaterial ref={core} color="#2a1a08" emissive="#ffb36b" emissiveIntensity={2} />
        </mesh>
        <spotLight
          ref={light}
          target={target}
          angle={0.6}
          penumbra={0.65}
          distance={40}
          decay={2}
          castShadow={shadows}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />
      </group>
    </>
  );
}
