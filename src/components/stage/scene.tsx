"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { paletteAt } from "@/lib/grade";
import type { Palette } from "@/lib/palette";
import type { BeatLabel } from "@/lib/sequence";
import { useStage } from "@/lib/stage-store";
import { Dust } from "./parts/dust";
import { Lamp } from "./parts/lamp";
import { Post } from "./post";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { FOV, FOV_COMPACT, cameraAt } from "@/lib/choreography";
import { Ember } from "./parts/stations/ember";
import { Florals } from "./parts/stations/florals";
import { Resins } from "./parts/stations/resins";
import { Woods } from "./parts/stations/woods";
import { Gearworks } from "./parts/gears";
import { Plate } from "./parts/plate";
import { Rete } from "./parts/rete";
import { Rim } from "./parts/rim";
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
    const { variant } = stageStore.getState();
    cameraAt(stageStore.getState().progress, pose, variant);
    const fov = variant === "compact" ? FOV_COMPACT : FOV;
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
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

/** Fog and background follow the grade, so each realm's air has its own colour. */
function Atmosphere({ palettes }: { palettes: Record<BeatLabel, Palette> }) {
  const fog = useRef<THREE.Fog>(null);
  const bg = useRef<THREE.Color>(null);
  useFrame(() => {
    const base = paletteAt(stageStore.getState().progress, palettes).base;
    fog.current?.color.set(base);
    bg.current?.set(base);
  });
  return (
    <>
      <color ref={bg} attach="background" args={["#0d0a07"]} />
      <fog ref={fog} attach="fog" args={["#0d0a07", 16, 85]} />
    </>
  );
}

/**
 * Ambient life (smoke, embers, dust, grain) needs frames even when progress
 * is still. Only once the visitor has interacted, never under reduced motion,
 * and never while the stage is hidden.
 */
function AmbientLoop() {
  const invalidate = useThree((s) => s.invalidate);
  useFrame(() => {
    const s = stageStore.getState();
    if (s.live && !s.reduced && s.mode !== "hidden") invalidate();
  });
  useEffect(() => stageStore.subscribe((s, prev) => s.live !== prev.live && invalidate()), [invalidate]);
  return null;
}

/**
 * Steps quality down when frames run slow: tilt-shift goes first, then the
 * dust, then shadows. Targets: 55 fps on a laptop, 30 on a phone. A quality
 * pinned with ?debug&quality=N is left alone.
 */
function Governor() {
  const compact = useStage((s) => s.variant === "compact");
  const step = (by: -1 | 1) => {
    const s = stageStore.getState();
    if (s.qualityPinned) return;
    const ceiling = s.variant === "compact" ? 2 : 3;
    const q = Math.max(0, Math.min(ceiling, s.quality + by)) as 0 | 1 | 2 | 3;
    if (q !== s.quality) stageStore.setState({ quality: q });
  };
  return (
    <PerformanceMonitor
      bounds={() => (compact ? [30, 50] : [55, 75])}
      flipflops={3}
      onDecline={() => step(-1)}
      onIncline={() => step(1)}
      onFallback={() => {
        if (!stageStore.getState().qualityPinned) stageStore.setState({ quality: 0 });
      }}
    />
  );
}

export function Scene({ familyLabels, palettes }: { familyLabels: string[]; palettes: Record<BeatLabel, Palette> }) {
  const quality = useStage((s) => s.quality);
  const postOff = useStage((s) => s.postOff);
  return (
    <>
      <Governor />
      <Atmosphere palettes={palettes} />
      {/*
        What the brass reflects. Metal has no diffuse colour, so without a
        reflection it reads black. The bright reflector stands where the
        lantern hangs, warm like it: the lamp seen in the metal, not a second
        light. A faint one opposite keeps shadowed faces from going flat.
      */}
      <Environment resolution={64} frames={1} environmentIntensity={0.9}>
        <Lightformer form="circle" intensity={3} position={[-1.2, 4, 1.5]} scale={2.2} color="#ffc68c" />
        <Lightformer form="rect" intensity={0.5} position={[-4, 3, 3]} scale={[8, 3, 1]} color="#ffd6a0" />
        <Lightformer form="rect" intensity={0.15} position={[5, 1, -4]} scale={[6, 3, 1]} />
      </Environment>
      <Lamp shadows={quality >= 1} />
      <Plate textureSize={2048} />
      <Gearworks />
      <Rete labels={familyLabels} textureSize={2048} />
      <Rim textureWidth={4096} />
      <Resins />
      <Florals />
      <Ember />
      <Woods />
      {quality >= 2 && <Dust />}
      {!postOff && <Post tiltShift={quality >= 3} />}
      <CameraRig />
      <Invalidator />
      <AmbientLoop />
    </>
  );
}
