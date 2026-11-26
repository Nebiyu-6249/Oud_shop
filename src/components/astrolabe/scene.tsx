"use client";

import { Environment, Lightformer, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { polar } from "@/components/flacon/kit";
import { MARKS, R, markAngle, type Layer } from "./geometry";
import type { ChannelId, Mechanism } from "./mechanism";
import { type AstrolabeModel, type Highlight, STROKE } from "./model";

// ------------------------------------------------------------ textures

const BRASS = "#c39c5e";
const ENGRAVE = "#2b1d0c";

type Fonts = { display: string; body: string; dir: CanvasDirection };

function readFonts(): Fonts {
  const cs = getComputedStyle(document.documentElement);
  return {
    display: cs.getPropertyValue("--font-display-face").trim() || "serif",
    body: cs.getPropertyValue("--font-body-face").trim() || "serif",
    dir: document.documentElement.dir === "rtl" ? "rtl" : "ltr",
  };
}

/** Deterministic pseudo-random, so the brushing is the same on every load. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Paints a layer's engraving onto turned brass. The canvas spans the unit
 * square [-1, 1], matching the UVs of the extruded caps. The same texture is
 * used as the bump map, so engraved lines read as cut grooves.
 */
function paintLayer(layer: Layer, size: number, fonts: Fonts, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const k = size / 2;
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, 0, size, size);

  // concentric lathe marks
  const rnd = rand(seed);
  ctx.setTransform(k, 0, 0, k, k, k);
  for (let i = 0; i < 260; i++) {
    const r = rnd();
    ctx.strokeStyle = rnd() > 0.5 ? "rgba(255,236,200,0.045)" : "rgba(60,40,15,0.045)";
    ctx.lineWidth = 0.0015 + rnd() * 0.003;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = ENGRAVE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of layer.strokes) {
    ctx.lineWidth = (s.fine ? STROKE.fine : STROKE.main) * 1.3;
    ctx.stroke(new Path2D(s.d));
  }

  // Text is set in pixel space: browsers handle sub-pixel font sizes badly.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = ENGRAVE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = fonts.dir;
  for (const t of layer.texts) {
    ctx.save();
    ctx.translate((t.x + 1) * k, (t.y + 1) * k);
    ctx.rotate((t.rotate * Math.PI) / 180);
    ctx.font = `${Math.round(t.size * k)}px ${t.font === "display" ? fonts.display : fonts.body}`;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(0.5, 0.5);
  tex.offset.set(0.5, 0.5);
  tex.anisotropy = 4;
  return tex;
}

// ------------------------------------------------------------ geometry

/** Unit (SVG, y down) points to a three.js shape (y up). */
function toShape(layer: Layer) {
  const shape = new THREE.Shape(layer.outline.map(([x, y]) => new THREE.Vector2(x, -y)));
  if (layer.hole) shape.holes.push(new THREE.Path(layer.hole.map(([x, y]) => new THREE.Vector2(x, -y))));
  return shape;
}

function extrude(layer: Layer, depth: number) {
  return new THREE.ExtrudeGeometry(toShape(layer), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 1,
  });
}

/** `detail` scales each part's texture relative to the instrument's size on screen. */
const PARTS: { id: keyof AstrolabeModel; z: number; depth: number; detail: number; channel?: ChannelId }[] = [
  { id: "mater", z: 0, depth: 0.05, detail: 1.25 },
  { id: "plate", z: 0.058, depth: 0.012, detail: 0.75, channel: "plate" },
  { id: "wear", z: 0.076, depth: 0.014, detail: 1, channel: "wear" },
  { id: "rete", z: 0.096, depth: 0.016, detail: 1, channel: "rete" },
  { id: "rule", z: 0.118, depth: 0.012, detail: 0.5, channel: "rule" },
];

/** Texture edge in pixels: enough for the device pixels it covers, no more. */
function textureSize(cssSize: number, dpr: number, detail: number) {
  const want = cssSize * Math.min(dpr, 2) * detail;
  return Math.min(2048, Math.max(512, 2 ** Math.ceil(Math.log2(want))));
}

const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));

// ------------------------------------------------------------ smoke

const SMOKE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Domain-warped fractional Brownian motion: value noise summed over octaves,
// fed back into its own coordinates, drifting upward like censer smoke.
const SMOKE_FRAG = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uSpan;
uniform vec3 uColor;
uniform vec3 uEmber;

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
  // world position in instrument units: the disc has radius 1
  vec2 w = (vUv - 0.5) * uSpan;
  float half_ = uSpan * 0.5;
  float t = uTime * 0.05;
  vec2 p = w * vec2(1.1, 0.8);
  vec2 q = vec2(fbm(p + vec2(0.0, -t)), fbm(p + vec2(5.2, 1.3 - t)));
  float d = fbm(p + 3.2 * q + vec2(0.0, -t * 2.6));
  float density = smoothstep(0.38, 0.92, d);
  // a column rising from behind the instrument, widening as it climbs
  float width = mix(0.45, 1.35, smoothstep(-0.8, half_, w.y));
  float column = 1.0 - smoothstep(0.55, 1.0, abs(w.x) / width);
  float rise = smoothstep(-0.9, 0.1, w.y) * (1.0 - smoothstep(half_ - 0.45, half_, w.y));
  float sides = 1.0 - smoothstep(half_ - 0.4, half_, abs(w.x));
  float a = density * column * rise * sides * 0.62;
  vec3 col = mix(uEmber, uColor, smoothstep(-0.6, 0.6, w.y));
  gl_FragColor = vec4(col, a);
}`;

function Smoke({ span }: { span: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpan: { value: span },
      uColor: { value: new THREE.Color("#ad9d85") },
      uEmber: { value: new THREE.Color("#8e2b1e") },
    }),
    [span],
  );
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <mesh position={[0, 0, -0.8]} renderOrder={-1}>
      <planeGeometry args={[span, span]} />
      <shaderMaterial
        ref={mat}
        vertexShader={SMOKE_VERT}
        fragmentShader={SMOKE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ------------------------------------------------------------ scene

/**
 * Frames the unit disc exactly, so a pointer's radius picks the right ring.
 * With bleed the canvas extends past the instrument on every side (room for
 * smoke) and the zoom compensates so the brass stays the same size.
 */
function Camera({ bleed }: { bleed: number }) {
  const size = useThree((s) => s.size);
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 10]}
      near={0.1}
      far={50}
      zoom={Math.min(size.width, size.height) / 2 / (1 + 2 * bleed)}
    />
  );
}

function Instrument({
  model,
  mech,
  highlights,
  tilt,
  reduced,
  onReady,
  bleed = 0,
}: {
  bleed?: number;
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  tilt: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const groups = useRef<Partial<Record<ChannelId, THREE.Group | null>>>({});
  const root = useRef<THREE.Group>(null);
  const visible = useRef(true);
  const [maps, setMaps] = useState<Record<string, THREE.Texture> | null>(null);

  const geometries = useMemo(
    () => Object.fromEntries(PARTS.map((p) => [p.id, extrude(model[p.id], p.depth)])),
    [model],
  );

  const cssSize = useThree((s) => Math.min(s.size.width, s.size.height)) / (1 + 2 * bleed);
  const dpr = useThree((s) => s.viewport.dpr);

  // Paint the engravings once the page fonts are ready, one part at a time
  // with a yield between, so no single task blocks the page for long.
  useEffect(() => {
    let cancelled = false;
    const fonts = readFonts();
    const sample = PARTS.flatMap((p) => model[p.id].texts.map((t) => t.text)).join("");
    Promise.all([
      document.fonts.load(`48px ${fonts.display}`, sample),
      document.fonts.load(`48px ${fonts.body}`, sample),
    ])
      .catch(() => undefined)
      .then(async () => {
        const out: Record<string, THREE.Texture> = {};
        for (const [i, p] of PARTS.entries()) {
          if (cancelled) return;
          out[p.id] = paintLayer(model[p.id], textureSize(cssSize, dpr, p.detail), fonts, 7 + i * 101);
          out[p.id].anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
          await yieldToMain();
        }
        if (!cancelled) setMaps(out);
      });
    return () => {
      cancelled = true;
    };
    // Repainting on every resize would be wasteful; the first size is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, gl]);

  useEffect(() => () => Object.values(maps ?? {}).forEach((t) => t.dispose()), [maps]);
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  // Tell the page once the first textured frame is on screen.
  useEffect(() => {
    if (!maps) return;
    invalidate();
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [maps, invalidate, onReady]);

  // Render on demand: whenever the mechanism moves, and while idling in view.
  useEffect(() => mech.subscribe(() => invalidate()), [mech, invalidate]);
  useEffect(() => {
    const el = gl.domElement;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) invalidate();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [gl, invalidate]);

  useFrame(({ clock }) => {
    mech.step(performance.now());
    for (const p of PARTS) {
      if (p.channel) {
        const g = groups.current[p.channel];
        if (g) g.rotation.z = -(mech.channels[p.channel].value * Math.PI) / 180;
      }
    }
    if (root.current) {
      if (tilt) {
        const t = reduced ? 0 : clock.getElapsedTime();
        root.current.rotation.x = -0.42 + Math.sin(t * 0.21) * 0.05;
        root.current.rotation.y = Math.sin(t * 0.13) * 0.12;
      } else {
        root.current.rotation.set(0, 0, 0);
      }
    }
    if (visible.current && (mech.moving || (tilt && !reduced))) invalidate();
  });

  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a7834b", metalness: 1, roughness: 0.42 }),
    [],
  );
  const capMaterials = useMemo(() => {
    if (!maps) return null;
    return Object.fromEntries(
      PARTS.map((p) => [
        p.id,
        new THREE.MeshStandardMaterial({
          map: maps[p.id],
          bumpMap: maps[p.id],
          bumpScale: 1.6,
          metalness: 1,
          roughness: 0.34,
        }),
      ]),
    );
  }, [maps]);

  const gems = useMemo(
    () =>
      Array.from({ length: MARKS }, (_, k) => {
        const [x, y] = polar([0, 0], R.markRing, markAngle(k));
        return new THREE.Vector3(x, -y, 0.056);
      }),
    [],
  );

  if (!capMaterials) return null;

  return (
    <group ref={root}>
      {PARTS.map((p) => {
        const mesh = (
          <mesh geometry={geometries[p.id]} material={[capMaterials[p.id], brass]} castShadow receiveShadow />
        );
        return (
          <group
            key={p.id}
            position={[0, 0, p.z]}
            ref={p.channel ? (g) => void (groups.current[p.channel!] = g) : undefined}
          >
            {mesh}
          </group>
        );
      })}
      {gems.map((pos, k) => {
        const h = highlights.find((x) => x.mark === k);
        return (
          <mesh key={k} position={pos} scale={[1, 1, 0.45]} castShadow>
            <sphereGeometry args={[0.017, 20, 12]} />
            <meshPhysicalMaterial
              color={h ? "#b8321c" : "#3a1410"}
              emissive={h ? "#ff5a2a" : "#000000"}
              emissiveIntensity={h ? 1.6 - h.rank * 0.35 : 0}
              roughness={0.12}
              clearcoat={1}
              metalness={0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

class Boundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Scene(props: {
  model: AstrolabeModel;
  mech: Mechanism;
  highlights: Highlight[];
  tilt: boolean;
  reduced: boolean;
  onReady: () => void;
  onFail: () => void;
  /** Extra canvas around the instrument, as a fraction of its size. */
  bleed?: number;
}) {
  const { onFail, bleed = 0 } = props;
  return (
    <Boundary onFail={onFail}>
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "default" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", () => onFail(), { once: true });
        }}
        style={{ pointerEvents: "none" }}
      >
        <Camera bleed={bleed} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[-2.5, 3, 5]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-1.2}
          shadow-camera-right={1.2}
          shadow-camera-top={1.2}
          shadow-camera-bottom={-1.2}
          shadow-bias={-0.0005}
        />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.2} position={[-2, 3, 4]} scale={[5, 1.5, 1]} />
          <Lightformer form="rect" intensity={0.8} position={[3, -1, 3]} scale={[3, 3, 1]} color="#ffd9a8" />
          <Lightformer form="ring" intensity={0.6} position={[0, 0, 6]} scale={4} />
        </Environment>
        {props.tilt && !props.reduced && <Smoke span={2 * (1 + 2 * bleed)} />}
        <Instrument {...props} />
      </Canvas>
    </Boundary>
  );
}
