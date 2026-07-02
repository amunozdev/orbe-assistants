'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  approach,
  createStateMix,
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  hexToRgb,
  orbVars,
  stateEnergy,
  type OrbProps,
  type OrbState,
} from '../../lib/orb-state';
import { observeActivity } from '../../lib/use-in-view';
import { useOrbLevel } from '../../lib/use-orb-level';
import { useWebGLSupport } from '../../lib/use-webgl-support';

type Vec3 = [number, number, number];

const FLOW_RATE: Record<OrbState, number> = {
  idle: 0.22,
  connecting: 0.55,
  listening: 0.72,
  thinking: 0.46,
  speaking: 1.35,
  error: 0.4,
  disabled: 0.02,
};

const STATE_KEYS = Object.keys(FLOW_RATE) as OrbState[];

const toUnit = (hex: string): Vec3 => {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
};

const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const ERROR_FROM_V = toUnit(ERROR_COLOR_FROM);
const ERROR_TO_V = toUnit(ERROR_COLOR_TO);

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uSize;
uniform float uTime;
uniform float uFlow;
uniform float uLevel;
uniform vec3 uColorFrom;
uniform vec3 uColorTo;
uniform float uConnect;
uniform float uListen;
uniform float uThink;
uniform float uSpeak;
uniform float uError;
uniform float uDisabled;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  for (int i = 0; i < 3; i++) {
    v += amp * noise(p);
    p = p * 2.03 + vec2(11.7, 5.3);
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - uSize) / uSize;
  float r = length(p);
  float mask = 1.0 - smoothstep(0.86, 0.92, r);
  if (mask < 0.003) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 drift = vec2(uFlow * 0.32, -uFlow * 0.21);
  vec2 q = vec2(fbm(p * 2.1 + drift), fbm(p * 2.1 + drift.yx + vec2(4.7, 1.9)));
  float n = fbm(p * 2.6 + 2.2 * q + vec2(uFlow * 0.42, uFlow * 0.27));

  float inter = sin(r * 24.0 - uTime * 3.1) * sin(r * 15.0 + uTime * 2.3);
  n += uThink * inter * (0.14 + 0.12 * uLevel);

  float ripple = sin(r * 30.0 - uTime * 6.5);
  n += uListen * ripple * (0.05 + 0.2 * uLevel);

  n = clamp(n, 0.0, 1.0);

  float fres = pow(smoothstep(0.3, 0.9, r), 2.0);

  float th = n * 1.7 + fres * 1.15 + uFlow * 0.1;
  vec3 film = 0.5 + 0.5 * cos(6.28318 * (th + vec3(0.0, 0.33, 0.67)));

  vec3 base = mix(uColorFrom, uColorTo, smoothstep(0.15, 0.85, n));
  float irid = clamp(0.4 + 0.35 * uSpeak + 0.18 * uListen + 0.3 * uLevel, 0.0, 1.0);
  irid *= 1.0 - 0.75 * uError;
  irid *= 1.0 - 0.7 * uDisabled;

  vec3 col = base * (0.62 + 0.85 * n);
  col += mix(uColorFrom, uColorTo, 0.5) * (1.0 - smoothstep(0.05, 0.75, r)) * 0.3;
  col += film * irid * (0.35 + 0.65 * fres);

  float ang = atan(p.y, p.x);
  float sweep = pow(0.5 + 0.5 * cos(ang - uTime * 2.4), 10.0);
  col += mix(uColorTo, vec3(1.0), 0.55) * sweep * smoothstep(0.35, 0.85, r) * uConnect * 1.1;

  col *= 1.0 + uListen * 0.22 * max(ripple, 0.0) * (0.4 + 0.6 * uLevel);
  col *= 1.0 + uThink * (0.12 * sin(uTime * 4.2) + 0.1 * inter);

  vec3 rim = mix(uColorTo, vec3(1.0), 0.45);
  col += rim * pow(smoothstep(0.55, 0.9, r), 3.0) * (0.4 + 0.55 * uLevel);
  col += vec3(0.98, 0.28, 0.35) * fres * uError * 0.35;

  col *= 0.9 + 0.45 * uLevel + 0.25 * uSpeak * uLevel;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum), uDisabled * 0.85);
  col *= 1.0 - 0.35 * uDisabled;

  col = col / (1.0 + 0.22 * col);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col * mask, mask);
}
`;

const fallbackOpacity = (state: OrbState): number => {
  switch (state) {
    case 'listening':
    case 'speaking':
      return 1;
    case 'thinking':
      return 0.9;
    case 'connecting':
      return 0.7;
    case 'error':
      return 0.95;
    default:
      return 0.85;
  }
};

export const IridescentFlow = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#c084fc',
  colorTo = '#67e8f9',
  levelRef,
  label = 'Iridescent Flow orb',
  className,
  ref,
}: OrbProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });
  const redrawRef = useRef<(() => void) | null>(null);
  const [lost, setLost] = useState(false);
  const support = useWebGLSupport();
  const showCanvas = support === true && !lost;

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      hostRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
    redrawRef.current?.();
  });

  useOrbLevel(hostRef, state, levelRef);

  useEffect(() => {
    if (!showCanvas) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    });
    if (!gl) {
      setLost(true);
      return;
    }

    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = compile(gl.VERTEX_SHADER, VERT);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    const dropResources = () => {
      if (vert) gl.deleteShader(vert);
      if (frag) gl.deleteShader(frag);
      if (program) gl.deleteProgram(program);
    };
    if (!vert || !frag || !program) {
      dropResources();
      setLost(true);
      return;
    }
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dropResources();
      setLost(true);
      return;
    }
    gl.useProgram(program);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(1, Math.round(size * dpr));
    canvas.width = px;
    canvas.height = px;
    gl.viewport(0, 0, px, px);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = {
      size: gl.getUniformLocation(program, 'uSize'),
      time: gl.getUniformLocation(program, 'uTime'),
      flow: gl.getUniformLocation(program, 'uFlow'),
      level: gl.getUniformLocation(program, 'uLevel'),
      colorFrom: gl.getUniformLocation(program, 'uColorFrom'),
      colorTo: gl.getUniformLocation(program, 'uColorTo'),
      connect: gl.getUniformLocation(program, 'uConnect'),
      listen: gl.getUniformLocation(program, 'uListen'),
      think: gl.getUniformLocation(program, 'uThink'),
      speak: gl.getUniformLocation(program, 'uSpeak'),
      error: gl.getUniformLocation(program, 'uError'),
      disabled: gl.getUniformLocation(program, 'uDisabled'),
    };
    gl.uniform1f(loc.size, px);

    let paletteKey = '';
    let fromV: Vec3 = [1, 1, 1];
    let toV: Vec3 = [1, 1, 1];
    const ensurePalette = () => {
      const key = `${colorRef.current.from}|${colorRef.current.to}`;
      if (key === paletteKey) return;
      paletteKey = key;
      fromV = toUnit(colorRef.current.from);
      toV = toUnit(colorRef.current.to);
    };

    const stateMix = createStateMix(stateRef.current);
    let clock = 0;
    let flow = 0;
    let levelS = 0;
    let flowRate = FLOW_RATE[stateRef.current];
    let raf = 0;
    let last: number | null = null;
    let running = false;
    let inView = true;

    const render = (dt: number, isStatic = false) => {
      ensurePalette();
      const st = stateRef.current;
      const easeDt = isStatic ? 60 : dt;
      const w = stateMix.update(st, easeDt);
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      levelS = approach(levelS, hasLive ? live : stateEnergy(st, clock), 8, easeDt);
      let rateTarget = 0;
      for (const key of STATE_KEYS) rateTarget += w[key] * FLOW_RATE[key];
      flowRate = approach(flowRate, rateTarget, 4, easeDt);
      flow += dt * speedRef.current * flowRate;
      const from = mix3(fromV, ERROR_FROM_V, w.error);
      const to = mix3(toV, ERROR_TO_V, w.error);
      gl.uniform1f(loc.time, clock);
      gl.uniform1f(loc.flow, flow);
      gl.uniform1f(loc.level, levelS);
      gl.uniform3f(loc.colorFrom, from[0], from[1], from[2]);
      gl.uniform3f(loc.colorTo, to[0], to[1], to[2]);
      gl.uniform1f(loc.connect, w.connecting);
      gl.uniform1f(loc.listen, w.listening);
      gl.uniform1f(loc.think, w.thinking);
      gl.uniform1f(loc.speak, w.speaking);
      gl.uniform1f(loc.error, w.error);
      gl.uniform1f(loc.disabled, w.disabled);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      clock += dt * speedRef.current;
      render(dt);
      raf = requestAnimationFrame(frame);
    };

    const renderStatic = () => {
      if (clock === 0) clock = 4.7;
      render(0, true);
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

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = () => {
      if (mq.matches || !inView) {
        stopLoop();
        if (mq.matches) renderStatic();
      } else {
        startLoop();
      }
    };
    applyMotion();
    mq.addEventListener('change', applyMotion);
    const unobserve = observeActivity(host, (active) => {
      inView = active;
      applyMotion();
    });
    redrawRef.current = () => {
      if (!running) renderStatic();
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      stopLoop();
      setLost(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      stopLoop();
      mq.removeEventListener('change', applyMotion);
      unobserve();
      canvas.removeEventListener('webglcontextlost', onLost);
      redrawRef.current = null;
      gl.deleteBuffer(buffer);
      dropResources();
    };
  }, [size, showCanvas, levelRef]);

  const isError = state === 'error';
  const fbFrom = isError ? ERROR_COLOR_FROM : colorFrom;
  const fbTo = isError ? ERROR_COLOR_TO : colorTo;

  return (
    <div
      ref={setRefs}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : 'grayscale(0)',
        transition: 'opacity 300ms ease, filter 300ms ease',
      }}
    >
      {showCanvas ? (
        <canvas ref={canvasRef} style={{ width: size, height: size, borderRadius: '50%' }} />
      ) : (
        <div
          aria-hidden
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.45), transparent 44%), conic-gradient(from 210deg, ${fbFrom}, ${fbTo}, ${fbFrom}, ${fbTo}, ${fbFrom})`,
            boxShadow: `0 0 calc(${Math.round(size * 0.08)}px + var(--orb-level, 0) * ${Math.round(size * 0.2)}px) color-mix(in oklab, ${fbTo} 55%, transparent)`,
            opacity: fallbackOpacity(state),
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </div>
  );
};
