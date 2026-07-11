'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { DotOrbit as DotOrbitShader } from '@paper-design/shaders-react';
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
  tint(from, 0.35),
  from,
  mixHex(from, to, 0.5),
  to,
  tint(to, 0.55),
  '#ffffff',
];

const ERROR_PALETTE = brandPalette(ERROR_COLOR_FROM, ERROR_COLOR_TO);

const GL_ATTRIBUTES: WebGLContextAttributes = {
  antialias: true,
  powerPreference: 'low-power',
};

const BASE_FRAME = 8000;
const PUSH_INTERVAL_MS = 66;
const MAX_DT = 0.1;
const ENERGY_RATE = 7.5;
const MOTION_RATE = 6;
const SPEED_RATE = 5;
const ERROR_RATE = 6;
const STATIC_PHASE = 0.9;

const speedFor = (s: OrbState) =>
  s === 'error'
    ? 1.7
    : s === 'listening'
      ? 1.5
      : s === 'speaking'
        ? 1.15
        : s === 'thinking'
          ? 0.8
          : s === 'connecting'
            ? 0.5
            : 0.3;

const motionFor = (s: OrbState, energy: number) => {
  switch (s) {
    case 'thinking':
      return { dotSize: 0.5, spreading: Math.min(1, 0.75 + energy * 0.25) };
    case 'listening':
    case 'speaking':
      return {
        dotSize: Math.min(1, 0.62 + energy * 0.38),
        spreading: Math.min(1, 0.4 + energy * 0.6),
      };
    case 'error':
      return { dotSize: 0.85, spreading: 1 };
    case 'connecting':
      return { dotSize: Math.min(0.85, 0.62 + energy * 0.23), spreading: 0.45 };
    default:
      return { dotSize: 0.68, spreading: 0.35 };
  }
};

const shaderSpeedFor = (s: OrbState, multiplier: number) =>
  s === 'disabled' ? 0 : speedFor(s) * multiplier;

interface DotMotion {
  energy: number;
  dotSize: number;
  spreading: number;
  shaderSpeed: number;
  errorMix: number;
}

const motionSeed = (s: OrbState, multiplier: number): DotMotion => ({
  energy: 0,
  ...motionFor(s, 0),
  shaderSpeed: shaderSpeedFor(s, multiplier),
  errorMix: s === 'error' ? 1 : 0,
});

const quantize = (value: number, steps: number) => Math.round(value * steps) / steps;

const sameMotion = (a: DotMotion, b: DotMotion) =>
  a.energy === b.energy &&
  a.dotSize === b.dotSize &&
  a.spreading === b.spreading &&
  a.shaderSpeed === b.shaderSpeed &&
  a.errorMix === b.errorMix;

export const DotOrbit = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#60a5fa',
  colorTo = '#c084fc',
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
  const [motion, setMotion] = useState<DotMotion>(() => motionSeed(state, speed));
  const accRef = useRef<DotMotion | null>(null);

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
      const target = motionFor(current, acc.energy);
      acc.dotSize = approach(acc.dotSize, target.dotSize, MOTION_RATE, dt);
      acc.spreading = approach(acc.spreading, target.spreading, MOTION_RATE, dt);
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
        const next: DotMotion = {
          energy: quantize(acc.energy, 50),
          dotSize: quantize(acc.dotSize, 100),
          spreading: quantize(acc.spreading, 100),
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
  const view: DotMotion = reduced
    ? {
        energy: staticLevel,
        ...motionFor(state, staticLevel),
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
  const coreFor = (f: string, t: string) =>
    `radial-gradient(circle at 50% 40%, ${tint(mixHex(f, t, 0.5), 0.45)}, ${mixHex(f, t, 0.55)} 20%, ${shade(f, 0.5)} 52%, ${shade(t, 0.85)} 100%)`;
  const core = coreFor(from, to);
  const coreGlow = `radial-gradient(circle at 50% 40%, ${tint(to, 0.8)}, ${tint(mixHex(from, to, 0.5), 0.25)} 22%, transparent 46%)`;
  const glow = `radial-gradient(circle at 50% 48%, color-mix(in oklab, ${from} 34%, transparent), color-mix(in oklab, ${to} 18%, transparent) 32%, transparent 58%)`;
  const edgeMask =
    'radial-gradient(ellipse 50% 50% at 50% 50%, black 56%, rgba(0,0,0,0.6) 76%, transparent 96%)';
  const occlusionMask =
    'radial-gradient(ellipse 27% 23% at 50% 41%, transparent 52%, rgba(0,0,0,0.8) 86%, black 100%)';
  const fallbackLayers = [
    { key: 'brand', from: colorFrom, to: colorTo, visible: state !== 'error' },
    { key: 'error', from: ERROR_COLOR_FROM, to: ERROR_COLOR_TO, visible: state === 'error' },
  ].map(({ key, from: f, to: t, visible }) => ({
    key,
    visible,
    base: coreFor(f, t),
    dots: `radial-gradient(circle, #ffffff 24%, transparent 30%), radial-gradient(circle, ${tint(t, 0.35)} 26%, transparent 32%), radial-gradient(circle, ${shade(f, 0.35)} 30%, transparent 36%)`,
    glow: `radial-gradient(circle at 50% 40%, ${tint(t, 0.6)}, transparent 55%)`,
  }));

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
        transform: showShader ? `scale(${(1 + view.energy * 0.06).toFixed(4)})` : undefined,
        scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.06)',
        transition: 'transform 0.2s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-24%',
          backgroundImage: glow,
          opacity: showShader
            ? Math.min(1, 0.35 + view.energy * 0.65)
            : 'calc(0.35 + var(--orb-level, 0) * 0.6)',
          transform: showShader ? `scale(${(1 + view.energy * 0.08).toFixed(4)})` : undefined,
          scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.08)',
          transition: showShader ? 'opacity 0.2s ease-out, transform 0.2s ease-out' : undefined,
        }}
      />
      <div
        ref={sphereRef}
        style={{
          position: 'absolute',
          inset: '18%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundImage: core,
        }}
      >
        {showShader ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundImage: coreGlow,
              opacity: Math.min(1, 0.3 + view.energy * 0.7),
              transition: 'opacity 0.2s ease-out',
            }}
          />
        ) : (
          fallbackLayers.map((layer) => (
            <div
              key={layer.key}
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundImage: layer.base,
                opacity: layer.visible ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundImage: layer.glow,
                  opacity: 'calc(0.25 + var(--orb-level, 0) * 0.75)',
                }}
              />
            </div>
          ))
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            backgroundImage:
              'radial-gradient(circle at 32% 24%, rgba(255,255,255,0.35), transparent 14%), radial-gradient(circle at 32% 28%, rgba(255,255,255,0.12), transparent 46%), radial-gradient(circle at 50% 116%, rgba(8,10,20,0.5), transparent 55%)',
          }}
        />
      </div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-12%',
          pointerEvents: 'none',
          maskImage: occlusionMask,
          WebkitMaskImage: occlusionMask,
        }}
      >
        {showShader ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotate(-18deg) scaleY(0.86) scale(${(1 + view.energy * 0.1).toFixed(4)})`,
              maskImage: edgeMask,
              WebkitMaskImage: edgeMask,
            }}
          >
            <DotOrbitShader
              width={size * 1.24}
              height={size * 1.24}
              colors={colors}
              colorBack="#00000000"
              size={view.dotSize}
              sizeRange={0.4}
              spreading={view.spreading}
              stepsPerColor={1}
              scale={0.62}
              speed={view.shaderSpeed}
              frame={BASE_FRAME}
              minPixelRatio={2}
              webGlContextAttributes={GL_ATTRIBUTES}
            />
          </div>
        ) : (
          fallbackLayers.map((layer) => (
            <div
              key={layer.key}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: layer.dots,
                backgroundSize: `${size * 0.2}px ${size * 0.2}px, ${size * 0.15}px ${size * 0.15}px, ${size * 0.12}px ${size * 0.12}px`,
                backgroundPosition: `0 0, ${size * 0.07}px ${size * 0.08}px, ${size * 0.03}px ${size * 0.12}px`,
                transform: 'rotate(-18deg) scaleY(0.86)',
                maskImage: edgeMask,
                WebkitMaskImage: edgeMask,
                opacity: layer.visible ? 'calc(0.6 + var(--orb-level, 0) * 0.4)' : 0,
                transition: 'opacity 0.35s ease',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
