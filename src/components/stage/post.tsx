"use client";

import { useFrame } from "@react-three/fiber";
import { EffectComposer, Noise, TiltShift2, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraAt } from "@/lib/choreography";
import { stageStore } from "@/lib/stage-store";

type TiltShiftHandle = { start: [number, number]; end: [number, number] };

/**
 * The miniature look: a tilt-shift band that keeps the subject sharp and
 * lets the near and far plate fall soft, a light vignette, and fine grain.
 */
export function Post({ tiltShift }: { tiltShift: boolean }) {
  const tilt = useRef<TiltShiftHandle>(null);
  const pose = useMemo(() => cameraAt(0), []);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    if (!tilt.current) return;
    // follow the subject: put the sharp band through its point on screen
    cameraAt(stageStore.getState().progress, pose);
    v.copy(pose.look).project(camera);
    const y = Math.min(0.9, Math.max(0.1, (v.y + 1) / 2));
    tilt.current.start = [0, y];
    tilt.current.end = [1, y];
  });

  return (
    <EffectComposer multisampling={4}>
      {[
        ...(tiltShift ? [<TiltShift2 key="tilt" ref={tilt as never} blur={0.22} taper={0.55} samples={8} />] : []),
        <Vignette key="vignette" offset={0.32} darkness={0.62} />,
        <Noise key="grain" blendFunction={BlendFunction.OVERLAY} opacity={0.14} />,
      ]}
    </EffectComposer>
  );
}
