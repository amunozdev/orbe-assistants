'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  approach,
  createStateMix,
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  hexToRgb,
  orbVars,
  type OrbProps,
  type OrbState,
} from '../../lib/orb-state';
import { observeActivity } from '../../lib/use-in-view';
import { useOrbLevel } from '../../lib/use-orb-level';
import { useWebGLSupport } from '../../lib/use-webgl-support';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uLevel;
uniform float uSpread;
uniform float uWobble;
uniform float uRipple;
uniform float uJitter;
uniform float uOrbit;
uniform float uGlow;
uniform float uGray;
uniform vec3 uColorFrom;
uniform vec3 uColorTo;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float x00 = mix(n000, n100, f.x);
  float x10 = mix(n010, n110, f.x);
  float x01 = mix(n001, n101, f.x);
  float x11 = mix(n011, n111, f.x);
  return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec3 ballPos(float fi) {
  float ph = fi * 2.399963;
  vec3 drift = vec3(
    sin(uTime * 0.9 + ph * 1.7),
    cos(uTime * 0.7 + ph * 2.3),
    sin(uTime * 0.6 + ph * 3.1) * 0.6
  );
  float ang = uTime * 2.4 + ph;
  vec3 ring = vec3(cos(ang), sin(ang), 0.3 * sin(uTime * 1.5 + ph));
  vec3 p = mix(drift, ring, uOrbit) * uSpread;
  p += uJitter * 0.09 * vec3(
    sin(uTime * 31.0 + ph * 9.0),
    cos(uTime * 27.0 + ph * 7.0),
    sin(uTime * 23.0 + ph * 5.0)
  );
  return p;
}

float map(vec3 p) {
  float d = length(p) - (0.3 + uLevel * 0.09);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec3 c = ballPos(fi);
    float r = 0.26 + 0.05 * sin(uTime * 1.3 + fi * 2.1);
    d = smin(d, length(p - c) - r, 0.3);
  }
  d += (noise(p * 2.6 + vec3(0.0, uTime * 0.35, 0.0)) - 0.5) * uWobble;
  d += sin(p.y * 16.0 - uTime * 7.0) * sin(p.x * 13.0 + uTime * 5.0) * uRipple * (0.2 + uLevel);
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.005, -0.005);
  return normalize(
    e.xyy * map(p + e.xyy) +
    e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) +
    e.xxx * map(p + e.xxx)
  );
}

void main() {
  vec2 uv = vUv;
  float rr = length(uv);
  float mask = 1.0 - smoothstep(0.96, 1.0, rr);
  if (mask <= 0.001) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(uv * 0.82, -1.6));
  float t = 0.8;
  bool hit = false;
  for (int i = 0; i < 40; i++) {
    vec3 pos = ro + rd * t;
    float d = map(pos);
    if (d < 0.003) {
      hit = true;
      break;
    }
    t += d * 0.85;
    if (t > 4.2) break;
  }
  vec3 mid = mix(uColorFrom, uColorTo, 0.5);
  vec3 col = mix(mid * 0.14, mid * 0.04, rr * rr);
  col += uColorTo * 0.1 * uLevel * uGlow * (1.0 - rr * rr);
  float alpha = 0.85;
  if (hit) {
    vec3 pos = ro + rd * t;
    vec3 n = calcNormal(pos);
    vec3 refl = reflect(rd, n);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float blend = clamp(0.5 + 0.45 * n.y + 0.2 * sin(pos.x * 2.4 + uTime * 0.3), 0.0, 1.0);
    vec3 tint = mix(uColorFrom, uColorTo, blend);
    float sky = 0.5 + 0.5 * refl.y;
    float env = 0.14 + 0.62 * sky * sky;
    env += 0.35 * pow(max(refl.y, 0.0), 6.0);
    env += 0.25 * pow(max(dot(refl, normalize(vec3(-0.6, 0.4, 0.6))), 0.0), 10.0);
    env *= 1.0 - 0.5 * smoothstep(-0.05, -0.6, refl.y);
    col = tint * env;
    float spec = pow(max(dot(refl, normalize(vec3(0.55, 0.75, 0.5))), 0.0), 42.0);
    col += vec3(1.1) * spec;
    col += tint * fres * 0.85;
    col *= 0.82 + 0.45 * uLevel * uGlow;
    alpha = 1.0;
  }
  col += mid * smoothstep(0.82, 0.98, rr) * (0.12 + 0.25 * uGlow * uLevel);
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(luma), uGray);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  float a = mask * alpha;
  gl_FragColor = vec4(col * a, a);
}
`;

const UNIFORM_NAMES = [
  'uTime',
  'uLevel',
  'uSpread',
  'uWobble',
  'uRipple',
  'uJitter',
  'uOrbit',
  'uGlow',
  'uGray',
  'uColorFrom',
  'uColorTo',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];
type UniformMap = Record<UniformName, WebGLUniformLocation | null>;

const STATE_KEYS: readonly OrbState[] = [
  'idle',
  'connecting',
  'listening',
  'thinking',
  'speaking',
  'error',
  'disabled',
];

interface MetalMotion {
  spread: number;
  wobble: number;
  ripple: number;
  jitter: number;
  orbit: number;
  glow: number;
  ts: number;
}

const motionFor = (s: OrbState, t: number, level: number): MetalMotion => {
  switch (s) {
    case 'connecting':
      return { spread: 0.72, wobble: 0.03, ripple: 0, jitter: 0, orbit: 1, glow: 0.4, ts: 1.1 };
    case 'listening':
      return { spread: 0.34, wobble: 0.045, ripple: 0.05, jitter: 0, orbit: 0, glow: 0.9, ts: 0.7 };
    case 'thinking':
      return {
        spread: 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.7)),
        wobble: 0.07,
        ripple: 0,
        jitter: 0,
        orbit: 0,
        glow: 0.5,
        ts: 0.9,
      };
    case 'speaking':
      return {
        spread: 0.3 + level * 0.5 + 0.06 * Math.sin(t * 5),
        wobble: 0.08,
        ripple: 0.02,
        jitter: 0,
        orbit: 0,
        glow: 1,
        ts: 1.25,
      };
    case 'error':
      return { spread: 0.5, wobble: 0.12, ripple: 0, jitter: 1, orbit: 0, glow: 0.6, ts: 1.7 };
    case 'disabled':
      return { spread: 0.34, wobble: 0.02, ripple: 0, jitter: 0, orbit: 0, glow: 0, ts: 0 };
    default:
      return { spread: 0.5, wobble: 0.05, ripple: 0, jitter: 0, orbit: 0, glow: 0.25, ts: 0.35 };
  }
};

const STATIC_T: Record<OrbState, number> = {
  idle: 0.9,
  connecting: 1.7,
  listening: 2.8,
  thinking: 0.4,
  speaking: 4.6,
  error: 5.2,
  disabled: 0.2,
};

const STATIC_LEVEL: Record<OrbState, number> = {
  idle: 0,
  connecting: 0.15,
  listening: 0.65,
  thinking: 0.3,
  speaking: 0.55,
  error: 0.25,
  disabled: 0,
};

const FALLBACK_GLOW: Record<OrbState, number> = {
  idle: 8,
  connecting: 14,
  listening: 26,
  thinking: 18,
  speaking: 30,
  error: 24,
  disabled: 0,
};

const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  premultipliedAlpha: true,
  powerPreference: 'low-power',
};

const MAX_BACKING = 384;

type Rgb = [number, number, number];

const ERR_FROM_RGB = hexToRgb(ERROR_COLOR_FROM);
const ERR_TO_RGB = hexToRgb(ERROR_COLOR_TO);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const fallbackLayerStyle = (
  state: OrbState,
  from: string,
  to: string,
  visible: boolean,
): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  background: `radial-gradient(circle at 32% 26%, ${to}, ${from} 52%, rgba(10, 14, 24, 0.92) 96%)`,
  boxShadow: `inset -8px -10px 24px rgba(10, 14, 24, 0.55), inset 6px 8px 18px rgba(255, 255, 255, 0.18), 0 0 ${FALLBACK_GLOW[state]}px ${to}66`,
  opacity: visible ? 1 : 0,
  transition: 'box-shadow 0.3s ease, opacity 0.35s ease',
});

const fallbackStyle = (state: OrbState, size: number): CSSProperties => ({
  width: size,
  height: size,
  position: 'relative',
  filter: state === 'disabled' ? 'grayscale(0.9)' : undefined,
  transition: 'filter 0.3s ease',
});

export const LiquidMetal = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#94a3b8',
  colorTo = '#e2e8f0',
  levelRef,
  label = 'Liquid Metal orb',
  className,
  ref: forwardedRef,
}: OrbProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });
  const redrawRef = useRef<(() => void) | null>(null);
  const support = useWebGLSupport();
  const [failed, setFailed] = useState(false);

  const setHostRef = useCallback(
    (node: HTMLDivElement | null) => {
      hostRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  useOrbLevel(hostRef, state, levelRef);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
    redrawRef.current?.();
  });

  useEffect(() => {
    if (support !== true || failed) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext('webgl', GL_ATTRIBUTES);
    if (!gl) {
      setFailed(true);
      return;
    }

    const uniforms = {} as UniformMap;

    const compile = (type: number, src: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const init = (): boolean => {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      const program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      for (const name of UNIFORM_NAMES) uniforms[name] = gl.getUniformLocation(program, name);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.min(Math.round(size * dpr), MAX_BACKING);
      canvas.width = px;
      canvas.height = px;
      gl.viewport(0, 0, px, px);
      gl.clearColor(0, 0, 0, 0);
      return true;
    };

    let paletteKey = '';
    let fromRgb: Rgb = [148, 163, 184];
    let toRgb: Rgb = [226, 232, 240];

    const ensurePalette = () => {
      const key = `${colorRef.current.from}|${colorRef.current.to}`;
      if (key === paletteKey) return;
      paletteKey = key;
      fromRgb = hexToRgb(colorRef.current.from);
      toRgb = hexToRgb(colorRef.current.to);
    };

    const stateMix = createStateMix(stateRef.current);
    let animT = 0;
    let levelS = 0;
    let raf = 0;
    let last: number | null = null;
    let running = false;
    let lost = false;
    let active = true;

    const chan = (a: number, b: number, e: number) => (a + (b - a) * e) / 255;

    const render = (dt: number, isStatic = false) => {
      ensurePalette();
      const st = stateRef.current;
      const w = stateMix.update(st, isStatic ? 60 : dt);
      if (isStatic) {
        animT = STATIC_T[st];
        levelS = STATIC_LEVEL[st];
      } else {
        const raw = clamp01(
          Number.parseFloat(getComputedStyle(host).getPropertyValue('--orb-level')) || 0,
        );
        levelS = approach(levelS, raw, 8, dt);
      }
      const level = clamp01(levelS);
      let spread = 0;
      let wobble = 0;
      let ripple = 0;
      let jitter = 0;
      let orbit = 0;
      let glow = 0;
      let ts = 0;
      for (const key of STATE_KEYS) {
        const wk = w[key];
        if (wk < 0.001) continue;
        const m = motionFor(key, animT, level);
        spread += m.spread * wk;
        wobble += m.wobble * wk;
        ripple += m.ripple * wk;
        jitter += m.jitter * wk;
        orbit += m.orbit * wk;
        glow += m.glow * wk;
        ts += m.ts * wk;
      }
      if (!isStatic) animT += dt * speedRef.current * ts;
      const e = w.error;
      gl.uniform1f(uniforms.uTime, animT);
      gl.uniform1f(uniforms.uLevel, level);
      gl.uniform1f(uniforms.uSpread, spread);
      gl.uniform1f(uniforms.uWobble, wobble);
      gl.uniform1f(uniforms.uRipple, ripple);
      gl.uniform1f(uniforms.uJitter, jitter);
      gl.uniform1f(uniforms.uOrbit, orbit);
      gl.uniform1f(uniforms.uGlow, glow);
      gl.uniform1f(uniforms.uGray, w.disabled);
      gl.uniform3f(
        uniforms.uColorFrom,
        chan(fromRgb[0], ERR_FROM_RGB[0], e),
        chan(fromRgb[1], ERR_FROM_RGB[1], e),
        chan(fromRgb[2], ERR_FROM_RGB[2], e),
      );
      gl.uniform3f(
        uniforms.uColorTo,
        chan(toRgb[0], ERR_TO_RGB[0], e),
        chan(toRgb[1], ERR_TO_RGB[1], e),
        chan(toRgb[2], ERR_TO_RGB[2], e),
      );
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      render(dt);
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      last = null;
      raf = requestAnimationFrame(frame);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const renderStatic = () => {
      if (!lost) render(0, true);
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const sync = () => {
      if (lost || !active) {
        stopLoop();
        return;
      }
      if (mq.matches) {
        stopLoop();
        renderStatic();
        return;
      }
      startLoop();
    };

    if (!init()) {
      setFailed(true);
      return;
    }

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      stopLoop();
    };

    const onRestored = () => {
      lost = false;
      if (init()) sync();
      else setFailed(true);
    };

    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    mq.addEventListener('change', sync);
    const unobserve = observeActivity(host, (next) => {
      active = next;
      sync();
    });
    sync();
    redrawRef.current = () => {
      if (!running && !lost && mq.matches) renderStatic();
    };

    return () => {
      stopLoop();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      mq.removeEventListener('change', sync);
      unobserve();
      redrawRef.current = null;
    };
  }, [support, failed, size]);

  return (
    <div
      ref={setHostRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        opacity: state === 'disabled' ? 0.55 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      {support === true && !failed ? (
        <canvas ref={canvasRef} style={{ width: size, height: size }} />
      ) : (
        <div style={fallbackStyle(state, size)}>
          <div style={fallbackLayerStyle(state, colorFrom, colorTo, state !== 'error')} />
          <div style={fallbackLayerStyle(state, ERROR_COLOR_FROM, ERROR_COLOR_TO, state === 'error')} />
        </div>
      )}
    </div>
  );
};
