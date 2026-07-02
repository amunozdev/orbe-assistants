'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stateEnergy, type OrbState } from '../../lib/orb-state';

const noiseGLSL = /* glsl */ `
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAudio;
uniform float uDistort;
uniform float uFreq;
uniform float uSpin;
uniform float uBreath;
varying float vNoise;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewDir;

${noiseGLSL}

float fbm(vec3 p){
  float n = snoise(p * 1.1);
  n += snoise(p * 2.4) * 0.4;
  n += snoise(p * 5.0) * 0.15;
  return n * 0.35;
}

vec3 rotateY(vec3 p, float a){
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x);
}

vec3 warpDomain(vec3 p){
  return rotateY(p, uSpin) * uFreq + uTime * vec3(0.12, 0.27, 0.08);
}

vec3 surfacePoint(vec3 p, float amp){
  return p + normalize(p) * fbm(warpDomain(p)) * amp;
}

void main(){
  float amp = uDistort * 0.55 + uAudio * 0.3;
  float radius = length(position);
  vec3 dir = normalize(position);
  float noise = fbm(warpDomain(position));
  vec3 displaced = position + dir * noise * amp;

  vec3 axis = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(dir, axis));
  vec3 bitangent = cross(dir, tangent);
  float eps = 0.01;
  vec3 pT = surfacePoint(normalize(position + tangent * eps) * radius, amp);
  vec3 pB = surfacePoint(normalize(position + bitangent * eps) * radius, amp);
  vec3 bent = normalize(cross(pT - displaced, pB - displaced));

  vNoise = noise;
  vPos = rotateY(position, uSpin);
  vec4 mv = modelViewMatrix * vec4(displaced * uBreath, 1.0);
  vNormal = normalize(normalMatrix * bent);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorFrom;
uniform vec3 uColorTo;
uniform float uTime;
uniform float uAudio;
uniform float uRim;
uniform float uMode;
varying float vNoise;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewDir;

${noiseGLSL}

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  float warp = snoise(vPos * 1.6 + uTime * vec3(0.1, 0.22, 0.0));
  float blend = clamp(0.5 + vNoise * 1.4 + warp * 0.3 + vPos.y * 0.1, 0.0, 1.0);
  vec3 base = mix(uColorFrom * 0.45, uColorFrom, smoothstep(0.0, 0.55, blend));
  base = mix(base, uColorTo, smoothstep(0.5, 1.0, blend));

  vec3 key = normalize(vec3(0.6, 0.8, 0.5));
  float lambert = dot(N, key) * 0.5 + 0.5;
  float diffuse = lambert * lambert;
  vec3 fillDir = normalize(vec3(-0.55, -0.35, 0.4));
  float fill = max(dot(N, fillDir), 0.0);
  vec3 halfway = normalize(key + V);
  float specular = pow(max(dot(N, halfway), 0.0), 48.0) * 0.35;

  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
  vec3 rimColor = mix(uColorTo, vec3(1.0), 0.3);

  vec3 col = base * (0.32 + diffuse * 1.15);
  col += vec3(0.42, 0.48, 0.7) * fill * 0.22;
  col += vec3(specular);
  col += rimColor * fres * (0.42 + uAudio * 0.38 + uRim * pulse * 0.55);
  col = col / (1.0 + col * 0.6);

  float shimmer = mix(9.0, 33.0, 1.0 - step(0.5, abs(uMode - 2.0)));
  float grain = hash(gl_FragCoord.xy + fract(uTime * shimmer) * 43.7);
  col *= 1.0 + (grain - 0.5) * 0.08;

  gl_FragColor = vec4(col, 1.0);
}
`;

const MODE: Record<OrbState, number> = {
  idle: 0,
  connecting: 1,
  listening: 2,
  thinking: 3,
  speaking: 4,
  error: 5,
  disabled: 6,
};

const DISTORT: Record<OrbState, number> = {
  idle: 0.3,
  connecting: 0.3,
  listening: 0.34,
  thinking: 0.46,
  speaking: 0.38,
  error: 0.34,
  disabled: 0.24,
};

const FREQ: Record<OrbState, number> = {
  idle: 1,
  connecting: 1,
  listening: 1.45,
  thinking: 0.85,
  speaking: 1.1,
  error: 1.25,
  disabled: 0.9,
};

const RESPONSE: Record<OrbState, number> = {
  idle: 8,
  connecting: 8,
  listening: 14,
  thinking: 8,
  speaking: 10,
  error: 8,
  disabled: 8,
};

const ENERGY_RANGE: Partial<Record<OrbState, readonly [number, number]>> = {
  connecting: [0.12, 0.1],
  listening: [0.4, 0.5],
  thinking: [0.24, 0.2],
  speaking: [0.3, 0.4],
};

const smoothEnergy = (state: OrbState, t: number): number => {
  const energy = stateEnergy(state, t);
  const range = ENERGY_RANGE[state];
  if (!range) return energy;
  const u = Math.min(Math.max((energy - range[0]) / range[1], 0), 1);
  return range[0] + range[1] * u * u;
};

const damp = (value: number, target: number, rate: number, dt: number): number =>
  value + (target - value) * (1 - Math.exp(-rate * dt));

const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getServerReducedMotion = (): boolean => false;

interface SphereProps {
  state: OrbState;
  speed: number;
  colorFrom: string;
  colorTo: string;
  reduced: boolean;
  levelRef?: RefObject<number>;
}

const Sphere = ({ state, speed, colorFrom, colorTo, reduced, levelRef }: SphereProps) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const invalidate = useThree((three) => three.invalidate);
  const clock = useRef(0);
  const smoothed = useRef(0);
  const spin = useRef(0);
  const breath = useRef(0);
  const palette = useRef({ from: new THREE.Color(colorFrom), to: new THREE.Color(colorTo) });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uDistort: { value: 0.3 },
      uFreq: { value: 1 },
      uSpin: { value: 0 },
      uBreath: { value: 1 },
      uRim: { value: 0 },
      uMode: { value: 0 },
      uColorFrom: { value: new THREE.Color() },
      uColorTo: { value: new THREE.Color() },
    }),
    [],
  );

  useEffect(() => {
    palette.current.from.set(state === 'error' ? '#fb7185' : colorFrom);
    palette.current.to.set(state === 'error' ? '#f43f5e' : colorTo);
    invalidate();
  }, [state, colorFrom, colorTo, invalidate]);

  useFrame((_, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    const dt = Math.min(delta, 0.1);
    if (!reduced) clock.current += dt * speed;
    const t = clock.current;

    const live = levelRef?.current;
    const hasLive = typeof live === 'number' && live >= 0;
    const floor = state === 'idle' ? 0.04 : 0;
    const target = Math.min(Math.max(hasLive ? live : smoothEnergy(state, t), floor), 1.15);
    const rimTarget = state === 'connecting' ? 1 : 0;
    const breathTarget = state === 'thinking' ? 0.028 : state === 'idle' ? 0.01 : 0;

    if (reduced) {
      smoothed.current = target;
      u.uDistort.value = DISTORT[state];
      u.uFreq.value = FREQ[state];
      u.uRim.value = rimTarget;
      breath.current = breathTarget;
    } else {
      smoothed.current = damp(smoothed.current, target, RESPONSE[state], dt);
      u.uDistort.value = damp(u.uDistort.value, DISTORT[state], 6, dt);
      u.uFreq.value = damp(u.uFreq.value, FREQ[state], 4, dt);
      u.uRim.value = damp(u.uRim.value, rimTarget, 5, dt);
      breath.current = damp(breath.current, breathTarget, 4, dt);
      spin.current += dt * speed * (state === 'thinking' ? 0.55 : 0.12);
    }

    u.uTime.value = t;
    u.uAudio.value = smoothed.current;
    u.uSpin.value = spin.current;
    u.uBreath.value = 1 + breath.current * Math.sin(t * 1.3);
    u.uMode.value = MODE[state];
    u.uColorFrom.value.copy(palette.current.from);
    u.uColorTo.value.copy(palette.current.to);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.2, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export interface NebulaSceneProps {
  state: OrbState;
  speed: number;
  colorFrom: string;
  colorTo: string;
  levelRef?: RefObject<number>;
}

export const NebulaScene = ({ state, speed, colorFrom, colorTo, levelRef }: NebulaSceneProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let inView = true;
    let pageVisible = document.visibilityState === 'visible';
    const sync = () => setActive(inView && pageVisible);
    const observer = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      sync();
    });
    observer.observe(canvas);
    const onVisibility = () => {
      pageVisible = document.visibilityState === 'visible';
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <Canvas
      ref={canvasRef}
      frameloop={reduced || !active ? 'demand' : 'always'}
      camera={{ position: [0, 0, 3.6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <Sphere
        state={state}
        speed={speed}
        colorFrom={colorFrom}
        colorTo={colorTo}
        reduced={reduced}
        levelRef={levelRef}
      />
    </Canvas>
  );
};
