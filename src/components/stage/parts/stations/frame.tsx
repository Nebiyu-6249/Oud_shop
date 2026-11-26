"use client";

import type { ReactNode } from "react";
import { type StationId, stationCenter } from "@/lib/choreography";
import { stationYaw } from "../../stations";

/** Places children in a station's frame: centred on it, +z toward its camera. */
export function StationFrame({ id, children }: { id: StationId; children: ReactNode }) {
  const c = stationCenter(id);
  return (
    <group position={[c.x, 0, c.z]} rotation-y={stationYaw(id)}>
      {children}
    </group>
  );
}

/** A hinge pin or axle along one axis: the visible pivot of anything that swings. */
export function Pin({
  at,
  axis,
  length,
  r = 0.018,
}: {
  at: [number, number, number];
  axis: "x" | "y" | "z";
  length: number;
  r?: number;
}) {
  // cylinders run along y; turn y onto the requested axis
  const rot: [number, number, number] = axis === "x" ? [0, 0, Math.PI / 2] : axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <mesh position={at} rotation={rot} castShadow>
      <cylinderGeometry args={[r, r, length, 10]} />
      <meshStandardMaterial color="#c9a66b" metalness={1} roughness={0.35} />
    </mesh>
  );
}
