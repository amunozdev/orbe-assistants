'use client';

import { useCallback, useEffect, useRef } from 'react';
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

const GRID = 23;
const TAU = Math.PI * 2;
const LIGHT_LEN = Math.hypot(-0.5, -0.65, 0.6);
const LX = -0.5 / LIGHT_LEN;
const LY = -0.65 / LIGHT_LEN;
const LZ = 0.6 / LIGHT_LEN;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const fract = (v: number) => v - Math.floor(v);

const hash2 = (a: number, b: number) =>
  fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);

const HASH = (() => {
  const table = new Float32Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) table[y * GRID + x] = hash2(x, y);
  }
  return table;
})();

interface FieldMode {
  key: OrbState;
  amp: number;
  lvlAmp: number;
  flow: number;
  wave: number;
  twist: number;
}

const FIELD_MODES: readonly FieldMode[] = [
  { key: 'idle', amp: 0.1, lvlAmp: 0, flow: -1, wave: 1.6, twist: 0 },
  { key: 'listening', amp: 0.12, lvlAmp: 0.22, flow: 1, wave: 3.2, twist: 0 },
  { key: 'thinking', amp: 0.16, lvlAmp: 0, flow: -1, wave: 2.2, twist: 2 },
  { key: 'connecting', amp: 0.05, lvlAmp: 0, flow: -1, wave: 1.8, twist: 0 },
  { key: 'speaking', amp: 0.12, lvlAmp: 0.28, flow: -1, wave: 3.6, twist: 0 },
  { key: 'error', amp: 0.07, lvlAmp: 0, flow: -1, wave: 1.2, twist: 0 },
];

type Rgb = ReturnType<typeof hexToRgb>;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

const REDUCED_LEVEL: Partial<Record<OrbState, number>> = {
  connecting: 0.15,
  listening: 0.55,
  thinking: 0.25,
  speaking: 0.8,
};

const parseColor = (ctx: CanvasRenderingContext2D, input: string): Rgb => {
  ctx.fillStyle = input;
  const parsed = String(ctx.fillStyle);
  if (parsed.startsWith('#')) return hexToRgb(parsed);
  const parts = parsed.match(/[\d.]+/g);
  return parts && parts.length >= 3
    ? [Number(parts[0]), Number(parts[1]), Number(parts[2])]
    : [127, 127, 127];
};

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const css = (c: Rgb, k: number) =>
  `rgb(${Math.round(c[0] * k)}, ${Math.round(c[1] * k)}, ${Math.round(c[2] * k)})`;

export const PixelOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#34d399',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
  ref: refProp,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setHostRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (typeof refProp === 'function') refProp(node);
      else if (refProp) refProp.current = node;
    },
    [refProp],
  );
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
    wakeRef.current?.();
  });

  useOrbLevel(ref, state, levelRef);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ink = parseColor(ctx, getComputedStyle(host).color);
    const darkTheme = 0.299 * ink[0] + 0.587 * ink[1] + 0.114 * ink[2] > 128;

    let raf = 0;
    let last: number | null = null;
    let clock = 0;
    let visible = true;
    let stepsKey = '';
    let baseSteps: Rgb[] = [];
    let lastErrW = -1;
    let ramp: string[] = [];
    let scanRamp: string[] = [];
    const rowOff = new Int8Array(GRID);

    const stateMix = createStateMix(stateRef.current);
    const fieldPhase = new Float64Array(FIELD_MODES.length);
    const fieldAmp = new Float64Array(FIELD_MODES.length);
    const fieldPh = new Float64Array(FIELD_MODES.length);
    const fieldTw = new Float64Array(FIELD_MODES.length);
    let breathePhase = 0;
    let wobbleA = 0;
    let wobbleB = 0;
    let arcPhase = 0;
    let twinklePhase = 0;
    let lvlSmooth = 0;

    const buildSteps = (from: string, to: string): Rgb[] => {
      const a = parseColor(ctx, from);
      const b = parseColor(ctx, to);
      const base = mix(a, b, 0.4);
      return [
        mix(base, BLACK, darkTheme ? 0.45 : 0.6),
        mix(base, BLACK, 0.35),
        darkTheme ? base : mix(base, BLACK, 0.08),
        mix(a, b, 0.7),
        mix(b, WHITE, 0.55),
      ];
    };

    const errSteps = buildSteps(ERROR_COLOR_FROM, ERROR_COLOR_TO);

    const ensureRamp = (from: string, to: string, errW: number) => {
      const key = `${from}|${to}`;
      if (key !== stepsKey) {
        stepsKey = key;
        baseSteps = buildSteps(from, to);
        lastErrW = -1;
      }
      if (errW === lastErrW) return;
      lastErrW = errW;
      const steps =
        errW > 0
          ? baseSteps.map((step, i) => mix(step, errSteps[i], errW))
          : baseSteps;
      ramp = steps.map((step) => css(step, 1));
      scanRamp = steps.map((step) => css(step, 0.94));
    };

    const render = (dt: number) => {
      const st = stateRef.current;
      const spdBase = reduce ? 0 : speedRef.current;
      const weights = stateMix.update(st, reduce ? 1e3 : dt);
      const wErr = weights.error;
      const wConn = weights.connecting;
      const motion = spdBase * (1 - weights.disabled);

      const rawLevel = reduce
        ? (REDUCED_LEVEL[st] ?? 0)
        : st === 'disabled'
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                Number.parseFloat(host.style.getPropertyValue('--orb-level')) || 0,
              ),
            );
      lvlSmooth = reduce ? rawLevel : approach(lvlSmooth, rawLevel, 12, dt);
      const lvl = lvlSmooth ** 1.4;

      ensureRamp(colorRef.current.from, colorRef.current.to, wErr);

      breathePhase += 1.3 * motion * dt;
      wobbleA += 2.1 * motion * dt;
      wobbleB += 1.3 * motion * dt;
      arcPhase += 2 * motion * dt;
      twinklePhase += 0.2 * motion * dt;

      let fieldCount = 0;
      for (let i = 0; i < FIELD_MODES.length; i++) {
        const mode = FIELD_MODES[i];
        fieldPhase[i] += mode.flow * mode.wave * motion * dt;
        const wm = weights[mode.key];
        if (wm === 0) continue;
        fieldAmp[fieldCount] = (mode.amp + mode.lvlAmp * lvl) * wm;
        fieldPh[fieldCount] = fieldPhase[i];
        fieldTw[fieldCount] = mode.twist;
        fieldCount += 1;
      }

      if (wErr > 0) {
        const seed = Math.floor(clock * Math.min(2.8, 2.2 * spdBase));
        for (let y = 0; y < GRID; y++) {
          const h = hash2(y, seed);
          rowOff[y] = h > 0.82 ? 1 : h < 0.18 ? -1 : 0;
        }
      }

      const c = (GRID - 1) / 2;
      const breathe = 1 + weights.idle * 0.03 * Math.sin(breathePhase);
      const baseR = GRID * 0.32 * breathe;
      const swell = 1 + 0.2 * lvl;
      const hx = Math.round(c - 0.35 * baseR * swell);
      const hy = Math.round(c - 0.4 * baseR * swell);

      ctx.clearRect(0, 0, GRID, GRID);

      for (let y = 0; y < GRID; y++) {
        const off = wErr > 0 ? rowOff[y] * wErr : 0;
        const row = y & 1 ? scanRamp : ramp;
        for (let x = 0; x < GRID; x++) {
          const dx = x - off - c;
          const dy = y - c;
          const dist = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const radius =
            baseR *
            (swell +
              0.12 * lvl * Math.sin(3 * ang + wobbleA) +
              0.05 * Math.sin(5 * ang - wobbleB));
          if (dist > radius) continue;
          const q = dist / radius;
          const nx = dx / radius;
          const ny = dy / radius;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const lam = Math.max(0, nx * LX + ny * LY + nz * LZ);
          let s = 0.14 + 0.78 * lam + (BAYER[y & 3][x & 3] / 16 - 0.5) / 5;
          for (let f = 0; f < fieldCount; f++) {
            s += fieldAmp[f] * Math.sin(dist * 0.95 + fieldPh[f] + ang * fieldTw[f]);
          }
          if (s < 0) s = 0;
          else if (s > 0.999) s = 0.999;
          if (q > 0.82 && s > 0.399) s = 0.399;
          if (wConn > 0 && q > 0.6) {
            const rel = fract((arcPhase - ang) / TAU) * TAU;
            if (rel < 1.7) s += (rel < 0.5 ? 0.4 : 0.2) * wConn;
          }
          let idx = (s * 5) | 0;
          if (idx > 4) idx = 4;
          if (x >= hx && x < hx + 2 && y >= hy && y < hy + 2) idx = 4;
          if (idx < 4 && fract(HASH[y * GRID + x] + twinklePhase) > 0.97) idx += 1;
          ctx.fillStyle = row[idx];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    const active = () =>
      visible &&
      !reduce &&
      (stateRef.current !== 'disabled' || stateMix.weights.disabled < 1);

    const step = (now: number) => {
      raf = 0;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      clock += dt;
      render(dt);
      if (active()) raf = requestAnimationFrame(step);
      else last = null;
    };

    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(step);
    };
    wakeRef.current = wake;

    const halt = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      last = null;
    };

    const unobserve = observeActivity(host, (next) => {
      visible = next;
      if (next) wake();
      else halt();
    });

    wake();

    return () => {
      halt();
      unobserve();
      wakeRef.current = null;
    };
  }, []);

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
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        width={GRID}
        height={GRID}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  );
};
