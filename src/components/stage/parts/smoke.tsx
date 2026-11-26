"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ambientTime } from "../ambient";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Domain-warped fbm drifting upward, masked into a rising column.
const FRAG = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uAmount;
uniform vec3 uColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vec2(vUv.x * 3.0, vUv.y * 2.4);
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(p + vec2(0.0, -t)), fbm(p + vec2(5.2, 1.3 - t)));
  float d = fbm(p + 3.0 * q + vec2(0.0, -t * 2.0));
  float density = smoothstep(0.3, 0.85, d);
  // how much smoke has risen so far: the column grows upward with uAmount
  float reach = smoothstep(uAmount * 1.05, uAmount * 1.05 - 0.25, vUv.y);
  // one column that sways and widens as it climbs, fading softly at its sides
  float centre = 0.5 + 0.07 * sin(vUv.y * 5.0 + t * 3.0) * vUv.y;
  float halfWidth = 0.08 + 0.22 * vUv.y;
  float edge = exp(-pow((vUv.x - centre) / halfWidth, 2.0));
  float top = 1.0 - smoothstep(0.7, 0.98, vUv.y);
  float a = density * reach * edge * top * (1.0 - vUv.y * 0.5) * 0.55;
  gl_FragColor = vec4(uColor, a);
}`;

/**
 * A column of censer smoke: one plane that turns about its vertical axis to
 * face the camera, so it always reads as a single soft column. `amount`
 * (0..1, from progress) sets how far it has risen; ambient time only stirs it.
 */
export function Smoke({ height = 1.6, width = 0.9, color = "#b8ab98", amount }: { height?: number; width?: number; color?: string; amount: () => number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmount: { value: 0 }, uColor: { value: new THREE.Color(color) } }),
    [color],
  );
  const world = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock, camera }) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = ambientTime(clock.getElapsedTime());
      mat.current.uniforms.uAmount.value = amount();
    }
    const g = group.current;
    if (g?.parent) {
      // face the camera about the vertical only, in the parent's frame
      g.parent.getWorldPosition(world);
      const local = g.parent.worldToLocal(camera.position.clone());
      g.rotation.y = Math.atan2(local.x - g.position.x, local.z - g.position.z);
    }
  });
  return (
    <group ref={group} position={[0, height / 2, 0]}>
      <mesh renderOrder={2}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={mat}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
