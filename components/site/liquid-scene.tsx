"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDetail;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p){
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i+vec3(1.0,0.0,0.0)), f.x),
          mix(hash(i+vec3(0.0,1.0,0.0)), hash(i+vec3(1.0,1.0,0.0)), f.x), f.y),
      mix(mix(hash(i+vec3(0.0,0.0,1.0)), hash(i+vec3(1.0,0.0,1.0)), f.x),
          mix(hash(i+vec3(0.0,1.0,1.0)), hash(i+vec3(1.0,1.0,1.0)), f.x), f.y),
      f.z);
  }
  void main() {
    vec3 pos = position;
    float t = uTime * uSpeed;
    float n = noise(pos * 1.35 + vec3(0.0, t * 0.18, 0.15));
    float n2 = uDetail > 0.5 ? noise(pos * 2.4 - vec3(t * 0.12, 0.2, 0.0)) : 0.5;
    pos += normal * ((n - 0.48) * 0.62 + (n2 - 0.5) * 0.28);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(vNormal);
    float ndv = clamp(dot(n, normalize(vView)), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 4.4);
    vec3 col = vec3(0.035, 0.037, 0.042);
    col += vec3(0.28, 0.29, 0.31) * pow(ndv, 1.6);
    col += uColorB * pow(clamp(n.y, 0.0, 1.0), 3.0) * 0.12;
    float spec = pow(clamp(dot(reflect(-normalize(vView), n), vec3(0.15, 0.9, 0.25)), 0.0, 1.0), 36.0);
    col += vec3(0.95) * spec;
    col += uColorA * fres;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

const pointVert = /* glsl */ `
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(uSize * (6.0 / max(1.0, -mv.z)), 1.2, 3.2);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFrag = /* glsl */ `
  uniform vec3 uColorA;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    gl_FragColor = vec4(uColorA, smoothstep(0.5, 0.15, length(uv)));
  }
`;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function sampleWord(word: string, count: number) {
  const w = 480;
  const h = 280;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 3);
  if (!ctx) return out;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";
  let size = 180;
  ctx.font = `700 ${size}px Vazirmatn, sans-serif`;
  while (ctx.measureText(word).width > w * 0.9 && size > 64) {
    size -= 8;
    ctx.font = `700 ${size}px Vazirmatn, sans-serif`;
  }
  ctx.fillText(word, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: number[] = [];
  const step = 4;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4] > 140) pts.push((x / w - 0.5) * 2.4, (0.5 - y / h) * 1.35, 0);
    }
  }
  const buckets = Math.max(1, Math.floor(pts.length / 3));
  for (let i = 0; i < count; i += 1) {
    const src = Math.floor(Math.random() * buckets) * 3;
    out[i * 3] = pts[src] ?? 0;
    out[i * 3 + 1] = pts[src + 1] ?? 0;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  return out;
}

function Scene({
  shape,
  colorA,
  colorB,
  speed,
  count,
  words,
  mobile,
}: {
  shape: string;
  colorA: string;
  colorB: string;
  speed: number;
  count: number;
  words: string[];
  mobile: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const clouds = useRef<Float32Array[]>([]);
  const shells = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const r = 0.9 + Math.random() * 0.55;
      data[i * 3] = Math.cos(a) * Math.sqrt(1 - u * u) * r;
      data[i * 3 + 1] = u * r * 0.85;
      data[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - u * u) * r * 0.7;
    }
    return data;
  }, [count]);
  const positions = useMemo(() => shells.slice(), [shells]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uDetail: { value: mobile ? 0 : 1 },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
    }),
    // live color updates happen in the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const pointUniforms = useMemo(
    () => ({
      uSize: { value: mobile ? 9 : 12 },
      uColorA: { value: new THREE.Color(colorA) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mobile],
  );

  useEffect(() => {
    uniforms.uColorA.value.set(colorA);
    uniforms.uColorB.value.set(colorB);
    uniforms.uSpeed.value = speed;
    pointUniforms.uColorA.value.set(colorA);
  }, [colorA, colorB, speed, uniforms, pointUniforms]);

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (!alive) return;
      clouds.current = (words.length ? words : ["کد"]).slice(0, 4).map((word) => sampleWord(word, count));
    };
    if (document.fonts?.load) {
      document.fonts.load("700 80px Vazirmatn").then(run).catch(run);
    } else run();
    return () => {
      alive = false;
    };
  }, [words, count]);

  const geometry = useMemo(() => {
    if (shape === "knot") return new THREE.TorusKnotGeometry(0.68, 0.2, mobile ? 80 : 140, mobile ? 8 : 16);
    if (shape === "ribbon") return new THREE.TorusGeometry(0.86, 0.26, mobile ? 12 : 24, mobile ? 48 : 90);
    return new THREE.IcosahedronGeometry(1.05, mobile ? 2 : 3);
  }, [shape, mobile]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const cycleRef = useRef(-1);
  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    uniforms.uTime.value = elapsed;
    if (group.current) group.current.rotation.y = elapsed * 0.08 * Math.max(speed, 0.2);
    const attr = points.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const cycle = 10;
    const scaled = elapsed * Math.max(speed, 0.35) + 4;
    const index = Math.floor(scaled / cycle);
    const local = scaled % cycle;
    let morph = 0;
    if (local > 1 && local < 2.2) morph = smoothstep((local - 1) / 1.2);
    else if (local >= 2.2 && local < 8) morph = 1;
    else if (local >= 8) morph = 1 - smoothstep((local - 8) / 1.6);
    if (index !== cycleRef.current) cycleRef.current = index;
    const cloud = clouds.current.length ? clouds.current[index % clouds.current.length] : null;
    const pos = attr.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      const sx = shells[i * 3];
      const sy = shells[i * 3 + 1];
      const sz = shells[i * 3 + 2];
      pos[i * 3] = sx + ((cloud ? cloud[i * 3] : sx) - sx) * morph;
      pos[i * 3 + 1] = sy + ((cloud ? cloud[i * 3 + 1] : sy) - sy) * morph;
      pos[i * 3 + 2] = sz + ((cloud ? cloud[i * 3 + 2] : sz) - sz) * morph;
    }
    attr.needsUpdate = true;
  });

  return (
    <>
      <group ref={group}>
        <mesh geometry={geometry}>
          <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
        </mesh>
      </group>
      {count > 0 ? (
        <points ref={points}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <shaderMaterial
            uniforms={pointUniforms}
            vertexShader={pointVert}
            fragmentShader={pointFrag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ) : null}
    </>
  );
}

export function LiquidScene(props: {
  shape: string;
  colorA: string;
  colorB: string;
  speed: number;
  count: number;
  words: string[];
  mobile: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      dpr={props.mobile ? [1, 1.15] : [1, 1.5]}
      frameloop={props.active ? "always" : "never"}
      camera={{ position: [0, 0.02, props.mobile ? 2.85 : 3.15], fov: 30 }}
      gl={{
        alpha: true,
        antialias: !props.mobile,
        powerPreference: "high-performance",
        stencil: false,
      }}
      style={{ background: "transparent" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000000", 0);
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
