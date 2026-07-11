'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';
import {
  approach,
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  hexToRgb,
  orbVars,
  stateEnergy,
  type OrbProps,
  type OrbState,
} from '../../lib/orb-state';
import { observeActivity } from '../../lib/use-in-view';
import { useWebGLSupport } from '../../lib/use-webgl-support';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

const mixHex = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
};

const shade = (hex: string, t: number) => mixHex(hex, '#000000', t);
const tint = (hex: string, t: number) => mixHex(hex, '#ffffff', t);

const brandPalette = (from: string, to: string): string[] => [
  shade(mixHex(from, to, 0.75), 0.48),
  from,
  tint(mixHex(from, to, 0.35), 0.75),
  mixHex(from, to, 0.55),
  shade(to, 0.38),
  to,
  tint(to, 0.35),
];

const ERROR_PALETTE = brandPalette(ERROR_COLOR_FROM, ERROR_COLOR_TO);

const GL_ATTRIBUTES: WebGLContextAttributes = {
  antialias: true,
  alpha: true,
  powerPreference: 'low-power',
};

const BASE_FRAME = 6000;
const PUSH_INTERVAL_MS = 66;
const MAX_DT = 0.1;
const ENERGY_RATE = 7.5;
const MOTION_RATE = 6;
const SPEED_RATE = 5;
const ERROR_RATE = 6;
const STATIC_PHASE = 0.9;
const BASE_SCALE = 0.92;

const speedFor = (s: OrbState) =>
  s === 'error'
    ? 2.2
    : s === 'listening'
      ? 1.9
      : s === 'speaking'
        ? 1.6
        : s === 'thinking'
          ? 0.85
          : s === 'connecting'
            ? 0.7
            : 0.45;

interface GrainTargets {
  softness: number;
  intensity: number;
  noise: number;
  swell: number;
}

const targetsFor = (s: OrbState, energy: number): GrainTargets => {
  switch (s) {
    case 'listening':
    case 'speaking':
      return {
        softness: Math.max(0.02, 0.1 - energy * 0.08),
        intensity: Math.min(1, 0.6 + energy * 0.4),
        noise: Math.min(1, 0.55 + energy * 0.45),
        swell: energy,
      };
    case 'thinking':
      return {
        softness: 0.28,
        intensity: Math.min(1, 0.75 + energy * 0.2),
        noise: 0.55,
        swell: energy * 0.4,
      };
    case 'connecting':
      return {
        softness: 0.35,
        intensity: Math.min(1, 0.5 + energy * 0.35),
        noise: 0.48,
        swell: energy * 0.6,
      };
    case 'error':
      return { softness: 0.02, intensity: 1, noise: 0.85, swell: 0.35 };
    case 'disabled':
      return { softness: 0.6, intensity: 0.3, noise: 0.25, swell: 0 };
    default:
      return { softness: 0.14, intensity: 0.85, noise: 0.55, swell: energy * 0.3 };
  }
};

const shaderSpeedFor = (s: OrbState, multiplier: number) =>
  s === 'disabled' ? 0 : speedFor(s) * multiplier;

interface OrbMotion {
  energy: number;
  softness: number;
  intensity: number;
  noise: number;
  swell: number;
  shaderSpeed: number;
  errorMix: number;
}

const motionSeed = (s: OrbState, multiplier: number): OrbMotion => ({
  energy: 0,
  ...targetsFor(s, 0),
  shaderSpeed: shaderSpeedFor(s, multiplier),
  errorMix: s === 'error' ? 1 : 0,
});

const quantize = (value: number, steps: number) => Math.round(value * steps) / steps;

const sameMotion = (a: OrbMotion, b: OrbMotion) =>
  a.energy === b.energy &&
  a.softness === b.softness &&
  a.intensity === b.intensity &&
  a.noise === b.noise &&
  a.swell === b.swell &&
  a.shaderSpeed === b.shaderSpeed &&
  a.errorMix === b.errorMix;

export const GrainOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#fb923c',
  colorTo = '#e879f9',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const showShader = webgl === true;
  const [motion, setMotion] = useState<OrbMotion>(() => motionSeed(state, speed));
  const accRef = useRef<OrbMotion | null>(null);

  const setRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
  });

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    if (accRef.current === null) {
      accRef.current = motionSeed(stateRef.current, speedRef.current);
    }
    const acc = accRef.current;
    let raf = 0;
    let prev: number | null = null;
    let clock = 0;
    let lastPush = 0;
    let active = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(MAX_DT, prev === null ? 1 / 60 : (now - prev) / 1000);
      prev = now;
      const current = stateRef.current;
      const multiplier = speedRef.current;
      clock += dt * multiplier;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      acc.energy = approach(
        acc.energy,
        hasLive ? live : stateEnergy(current, clock),
        ENERGY_RATE,
        dt,
      );
      const target = targetsFor(current, acc.energy);
      acc.softness = approach(acc.softness, target.softness, MOTION_RATE, dt);
      acc.intensity = approach(acc.intensity, target.intensity, MOTION_RATE, dt);
      acc.noise = approach(acc.noise, target.noise, MOTION_RATE, dt);
      acc.swell = approach(acc.swell, target.swell, MOTION_RATE, dt);
      acc.shaderSpeed = approach(
        acc.shaderSpeed,
        shaderSpeedFor(current, multiplier),
        SPEED_RATE,
        dt,
      );
      acc.errorMix = approach(acc.errorMix, current === 'error' ? 1 : 0, ERROR_RATE, dt);
      root.style.setProperty('--orb-level', acc.energy.toFixed(3));
      if (showShader && now - lastPush > PUSH_INTERVAL_MS) {
        lastPush = now;
        const next: OrbMotion = {
          energy: quantize(acc.energy, 50),
          softness: quantize(acc.softness, 100),
          intensity: quantize(acc.intensity, 100),
          noise: quantize(acc.noise, 200),
          swell: quantize(acc.swell, 100),
          shaderSpeed: quantize(acc.shaderSpeed, 100),
          errorMix: quantize(acc.errorMix, 100),
        };
        setMotion((prevMotion) => (sameMotion(prevMotion, next) ? prevMotion : next));
      }
      if (active) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf === 0) {
        prev = null;
        raf = requestAnimationFrame(frame);
      }
    };
    const halt = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      prev = null;
    };
    const unobserve = observeActivity(root, (next) => {
      active = next;
      if (next) wake();
      else halt();
    });
    wake();
    return () => {
      halt();
      unobserve();
    };
  }, [levelRef, reduced, showShader]);

  useEffect(() => {
    if (state !== 'error' || reduced) return;
    const el = sphereRef.current;
    if (!el) return;
    const shake = el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-1.5px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(1px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 340, easing: 'ease-out' },
    );
    return () => shake.cancel();
  }, [state, reduced]);

  const staticLevel = stateEnergy(state, STATIC_PHASE);
  const view: OrbMotion = reduced
    ? {
        energy: staticLevel,
        ...targetsFor(state, staticLevel),
        shaderSpeed: 0,
        errorMix: state === 'error' ? 1 : 0,
      }
    : motion;
  const errorMix = showShader ? view.errorMix : state === 'error' ? 1 : 0;
  const from =
    errorMix >= 1
      ? ERROR_COLOR_FROM
      : errorMix <= 0
        ? colorFrom
        : mixHex(colorFrom, ERROR_COLOR_FROM, errorMix);
  const to =
    errorMix >= 1
      ? ERROR_COLOR_TO
      : errorMix <= 0
        ? colorTo
        : mixHex(colorTo, ERROR_COLOR_TO, errorMix);
  const brandColors = brandPalette(colorFrom, colorTo);
  const colors =
    errorMix >= 1
      ? ERROR_PALETTE
      : errorMix <= 0
        ? brandColors
        : brandColors.map((stop, index) => mixHex(stop, ERROR_PALETTE[index], errorMix));
  const fallbackLayers = [
    { key: 'brand', from: colorFrom, to: colorTo, visible: state !== 'error' },
    { key: 'error', from: ERROR_COLOR_FROM, to: ERROR_COLOR_TO, visible: state === 'error' },
  ].map(({ key, from: f, to: t, visible }) => ({
    key,
    visible,
    base: `conic-gradient(from 210deg at 42% 38%, ${shade(f, 0.5)}, ${f} 18%, ${tint(mixHex(f, t, 0.4), 0.6)} 34%, ${mixHex(f, t, 0.6)} 48%, ${t} 62%, ${shade(t, 0.55)} 78%, ${shade(f, 0.5)})`,
    glow: `radial-gradient(circle at 62% 72%, ${tint(f, 0.3)}, transparent 45%), radial-gradient(circle at 50% 50%, transparent 52%, ${shade(mixHex(f, t, 0.5), 0.65)} 100%)`,
  }));
  const shadowColor = shade(mixHex(from, to, 0.5), 0.55);

  return (
    <div
      ref={setRootRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        ...(reduced ? ({ '--orb-level': staticLevel.toFixed(3) } as CSSProperties) : null),
        width: size,
        height: size,
        position: 'relative',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : 'grayscale(0)',
        transform: showShader ? `scale(${(1 + view.swell * 0.06).toFixed(4)})` : undefined,
        scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.06)',
        transition: 'transform 0.2s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '18%',
          right: '18%',
          bottom: -size * 0.09,
          height: size * 0.11,
          borderRadius: '50%',
          background: `radial-gradient(ellipse closest-side, color-mix(in oklab, ${shadowColor} 65%, transparent), transparent 78%)`,
          filter: `blur(${(size * 0.015).toFixed(1)}px)`,
          opacity: showShader
            ? Math.max(0.18, 0.42 - view.swell * 0.22)
            : 'calc(0.42 - var(--orb-level, 0) * 0.22)',
          transform: showShader ? `scale(${(1 - view.swell * 0.12).toFixed(4)})` : undefined,
          scale: showShader ? undefined : 'calc(1 - var(--orb-level, 0) * 0.12)',
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out, background 0.35s ease',
        }}
      />
      <div
        ref={sphereRef}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {showShader ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              maskImage: 'radial-gradient(circle, #000 58%, transparent 71%)',
              WebkitMaskImage: 'radial-gradient(circle, #000 58%, transparent 71%)',
            }}
          >
            <GrainGradient
              width={size}
              height={size}
              colors={colors}
              colorBack="#00000000"
              shape="sphere"
              softness={view.softness}
              intensity={view.intensity}
              noise={view.noise}
              scale={BASE_SCALE + view.swell * 0.06}
              speed={view.shaderSpeed}
              frame={BASE_FRAME}
              minPixelRatio={2}
              webGlContextAttributes={GL_ATTRIBUTES}
            />
          </div>
        ) : (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              maskImage: 'radial-gradient(circle closest-side, #000 82%, transparent 99%)',
              WebkitMaskImage: 'radial-gradient(circle closest-side, #000 82%, transparent 99%)',
            }}
          >
            {fallbackLayers.map((layer) => (
              <div
                key={layer.key}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: layer.base,
                  opacity: layer.visible ? 1 : 0,
                  transition: 'opacity 0.35s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: layer.glow,
                    opacity: 'calc(0.25 + var(--orb-level, 0) * 0.75)',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
