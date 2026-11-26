"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cameraAt } from "@/lib/choreography";
import { lampAt } from "@/lib/grade";
import { stageStore } from "@/lib/stage-store";
import { ambientTime } from "../ambient";
import { rand } from "../engrave";
import { lampPosition } from "./lamp";

const COUNT = 420;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;
attribute float aSeed;
varying float vSeed;
void main() {
  vSeed = aSeed;
  vec3 p = position;
  // a slow, wandering drift: each mote on its own lazy loop
  p.x += sin(uTime * 0.21 + aSeed * 31.0) * 0.12;
  p.y += sin(uTime * 0.13 + aSeed * 17.0) * 0.16 + mod(uTime * 0.015 + aSeed, 1.0) * 0.4 - 0.2;
  p.z += cos(uTime * 0.17 + aSeed * 23.0) * 0.12;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.5 + aSeed) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vSeed;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d) * uOpacity * (0.4 + 0.6 * vSeed);
  gl_FragColor = vec4(uColor, a);
}`;

/** Motes drifting in the lamp's beam, between the lantern and its subject. */
export function Dust() {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const r = rand(5);
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // a cone from the lamp (top) widening to the subject (bottom), in a unit frame
      const t = r();
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * (0.15 + t * 0.9);
      pos.set([Math.cos(a) * rad, 1 - t, Math.sin(a) * rad], i * 3);
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSize: { value: 15 }, uColor: { value: new THREE.Color() }, uOpacity: { value: 0.32 } }),
    [],
  );
  const pose = useMemo(() => cameraAt(0), []);
  const lamp = useMemo(() => new THREE.Vector3(), []);
  const mat = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, gl }) => {
    const p = stageStore.getState().progress;
    cameraAt(p, pose, stageStore.getState().variant);
    lampPosition(pose.pos, pose.look, lamp);
    // stretch the unit cone so it hangs from the lamp down to the subject
    const g = points.current;
    if (g) {
      g.position.set(pose.look.x, pose.look.y, pose.look.z);
      g.scale.set(1.2, Math.max(0.5, lamp.y - pose.look.y), 1.2);
    }
    if (mat.current) {
      mat.current.uniforms.uTime.value = ambientTime(clock.getElapsedTime());
      mat.current.uniforms.uColor.value.set(lampAt(p).color);
      mat.current.uniforms.uSize.value = 15 * gl.getPixelRatio();
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
