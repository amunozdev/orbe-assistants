'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
import { orbVars, stateEnergy, type OrbProps, type OrbState } from '../../lib/orb-state';

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

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

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
  shade(from, 0.35),
  from,
  mixHex(from, to, 0.5),
  to,
  tint(to, 0.35),
];

const ERROR_FROM = '#fb7185';
const ERROR_TO = '#f43f5e';
const ERROR_PALETTE = brandPalette(ERROR_FROM, ERROR_TO);

const GL_ATTRIBUTES: WebGLContextAttributes = {
  antialias: true,
  powerPreference: 'low-power',
};

const speedFor = (s: OrbState) =>
  s === 'error'
    ? 1.8
    : s === 'listening'
      ? 1.6
      : s === 'speaking'
        ? 1.1
        : s === 'thinking'
          ? 0.95
          : s === 'connecting'
            ? 0.5
            : 0.3;

const grainFor = (s: OrbState) =>
  s === 'error'
    ? 0.2
    : s === 'speaking'
      ? 0.18
      : s === 'listening'
        ? 0.16
        : s === 'thinking'
          ? 0.1
          : s === 'connecting'
            ? 0.08
            : 0.06;

const motionFor = (s: OrbState, energy: number) => {
  switch (s) {
    case 'thinking':
      return { distortion: 0.35, swirl: Math.min(1, 0.75 + energy * 0.2) };
    case 'listening':
    case 'speaking':
      return {
        distortion: Math.min(1, 0.5 + energy * 0.4),
        swirl: Math.min(1, 0.3 + energy * 0.25),
      };
    case 'error':
      return { distortion: 0.85, swirl: 0.55 };
    case 'connecting':
      return { distortion: Math.min(1, 0.42 + energy * 0.55), swirl: 0.3 };
    default:
      return { distortion: 0.42, swirl: 0.26 };
  }
};

export const PlasmaOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#7c3aed',
  colorTo = '#06b6d4',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const sphereRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const [rawEnergy, setRawEnergy] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
  });

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start: number | null = null;
    let last = 0;
    let smoothed = 0;
    const frame = (now: number) => {
      if (start === null) start = now;
      const t = ((now - start) / 1000) * speedRef.current;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(stateRef.current, t);
      smoothed += (target - smoothed) * 0.12;
      if (now - last > 66) {
        last = now;
        setRawEnergy(Math.round(smoothed * 50) / 50);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef, reduced]);

  useEffect(() => {
    if (state !== 'error' || reduced) return;
    const el = sphereRef.current;
    if (!el) return;
    const shake = el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 340, easing: 'ease-out' },
    );
    return () => shake.cancel();
  }, [state, reduced]);

  const energy = reduced ? 0 : rawEnergy;
  const isError = state === 'error';
  const frozen = reduced || state === 'disabled';
  const from = isError ? ERROR_FROM : colorFrom;
  const to = isError ? ERROR_TO : colorTo;
  const colors = useMemo(
    () => (isError ? ERROR_PALETTE : brandPalette(colorFrom, colorTo)),
    [isError, colorFrom, colorTo],
  );
  const { distortion, swirl } = motionFor(state, energy);

  return (
    <div
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transform: `scale(${(1 + energy * 0.06).toFixed(4)})`,
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: `0 ${-size * 0.06}px ${size * 0.3}px color-mix(in oklab, ${from} 55%, transparent), 0 ${size * 0.06}px ${size * 0.3}px color-mix(in oklab, ${to} 55%, transparent)`,
          opacity: Math.min(1, 0.35 + energy * 0.65),
          transform: `scale(${(1 + energy * 0.08).toFixed(4)})`,
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
        }}
      />
      <div
        ref={sphereRef}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${from} 45%, transparent), 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      >
        <MeshGradient
          width={size}
          height={size}
          colors={colors}
          distortion={distortion}
          swirl={swirl}
          scale={1.15}
          speed={frozen ? 0 : speedFor(state) * speed}
          frame={frozen ? 8000 : 0}
          grainMixer={grainFor(state)}
          grainOverlay={0.05}
          minPixelRatio={2}
          webGlContextAttributes={GL_ATTRIBUTES}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            backgroundImage:
              'radial-gradient(circle at 31% 22%, rgba(255,255,255,0.55), transparent 14%), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.28), transparent 48%), radial-gradient(circle at 68% 76%, rgba(10,14,24,0.42), transparent 60%)',
          }}
        />
      </div>
    </div>
  );
};
