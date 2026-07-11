'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { Dithering } from '@paper-design/shaders-react';
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

const GL_ATTRIBUTES: WebGLContextAttributes = {
  antialias: true,
  powerPreference: 'low-power',
};

const BASE_FRAME = 6000;
const PUSH_INTERVAL_MS = 66;
const MAX_DT = 0.1;
const ENERGY_RATE = 7.5;
const DOT_RATE = 6;
const SPEED_RATE = 5;
const SHIFT_RATE = 5;
const PULSE_RATE = 6;
const ERROR_RATE = 6;
const STATIC_PHASE = 0.9;

const speedFor = (s: OrbState) =>
  s === 'error'
    ? 1.7
    : s === 'listening'
      ? 1.45
      : s === 'speaking'
        ? 1.15
        : s === 'thinking'
          ? 0.85
          : s === 'connecting'
            ? 0.45
            : 0.25;

const dotPxFor = (s: OrbState, energy: number) => {
  switch (s) {
    case 'listening':
    case 'speaking':
      return Math.max(1.6, 3.4 - energy * 1.5);
    case 'thinking':
      return 2.7;
    case 'connecting':
      return 3.2 - energy * 0.6;
    case 'error':
      return 2.2;
    default:
      return 3.4;
  }
};

const shiftFor = (s: OrbState, energy: number) =>
  s === 'thinking' ? 0.55 : Math.min(1, 0.25 + energy * 0.65);

const pulseFor = (s: OrbState, energy: number) =>
  s === 'disabled' ? 0.9 : Math.min(1.1, 0.9 + energy * 0.16);

const shaderSpeedFor = (s: OrbState, multiplier: number) =>
  s === 'disabled' ? 0 : speedFor(s) * multiplier;

interface OrbMotion {
  energy: number;
  dotPx: number;
  shaderSpeed: number;
  shift: number;
  pulse: number;
  errorMix: number;
}

const motionSeed = (s: OrbState, multiplier: number): OrbMotion => ({
  energy: 0,
  dotPx: dotPxFor(s, 0),
  shaderSpeed: shaderSpeedFor(s, multiplier),
  shift: shiftFor(s, 0),
  pulse: pulseFor(s, 0),
  errorMix: s === 'error' ? 1 : 0,
});

const quantize = (value: number, steps: number) => Math.round(value * steps) / steps;

const sameMotion = (a: OrbMotion, b: OrbMotion) =>
  a.energy === b.energy &&
  a.dotPx === b.dotPx &&
  a.shaderSpeed === b.shaderSpeed &&
  a.shift === b.shift &&
  a.pulse === b.pulse &&
  a.errorMix === b.errorMix;

export const DitherOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#a3e635',
  colorTo = '#22d3ee',
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
      acc.dotPx = approach(acc.dotPx, dotPxFor(current, acc.energy), DOT_RATE, dt);
      acc.shaderSpeed = approach(
        acc.shaderSpeed,
        shaderSpeedFor(current, multiplier),
        SPEED_RATE,
        dt,
      );
      acc.shift = approach(acc.shift, shiftFor(current, acc.energy), SHIFT_RATE, dt);
      acc.pulse = approach(acc.pulse, pulseFor(current, acc.energy), PULSE_RATE, dt);
      acc.errorMix = approach(acc.errorMix, current === 'error' ? 1 : 0, ERROR_RATE, dt);
      root.style.setProperty('--orb-level', acc.energy.toFixed(3));
      if (showShader && now - lastPush > PUSH_INTERVAL_MS) {
        lastPush = now;
        const next: OrbMotion = {
          energy: quantize(acc.energy, 50),
          dotPx: quantize(acc.dotPx, 50),
          shaderSpeed: quantize(acc.shaderSpeed, 100),
          shift: quantize(acc.shift, 100),
          pulse: quantize(acc.pulse, 200),
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
        dotPx: dotPxFor(state, staticLevel),
        shaderSpeed: 0,
        shift: shiftFor(state, staticLevel),
        pulse: pulseFor(state, staticLevel),
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
  const front = tint(mixHex(from, to, view.shift), 0.12);
  const back = shade(mixHex(from, to, 0.5), 0.82);
  const fallbackLayers = [
    { key: 'brand', from: colorFrom, to: colorTo, visible: state !== 'error' },
    { key: 'error', from: ERROR_COLOR_FROM, to: ERROR_COLOR_TO, visible: state === 'error' },
  ].map(({ key, from: f, to: t, visible }) => ({
    key,
    visible,
    base: `radial-gradient(circle at 50% 38%, ${tint(mixHex(f, t, 0.4), 0.1)}, ${mixHex(f, t, 0.6)} 52%, ${shade(mixHex(f, t, 0.5), 0.78)} 100%)`,
    dots: `radial-gradient(circle, ${tint(t, 0.3)} 1px, transparent 1.6px)`,
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
        borderRadius: '50%',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : 'grayscale(0)',
        transform: showShader ? `scale(${(1 + view.energy * 0.05).toFixed(4)})` : undefined,
        scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.05)',
        transition: 'transform 0.2s ease-out, opacity 0.3s ease-out, filter 0.3s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: `0 ${-size * 0.05}px ${size * 0.28}px color-mix(in oklab, ${from} 50%, transparent), 0 ${size * 0.05}px ${size * 0.28}px color-mix(in oklab, ${to} 50%, transparent)`,
          opacity: showShader
            ? Math.min(1, 0.3 + view.energy * 0.7)
            : 'calc(0.3 + var(--orb-level, 0) * 0.65)',
          transform: showShader ? `scale(${(1 + view.energy * 0.07).toFixed(4)})` : undefined,
          scale: showShader ? undefined : 'calc(1 + var(--orb-level, 0) * 0.07)',
          transition: showShader
            ? 'opacity 0.2s ease-out, transform 0.2s ease-out, box-shadow 0.35s ease'
            : 'box-shadow 0.35s ease',
        }}
      />
      <div
        ref={sphereRef}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: back,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${front} 40%, transparent), 0 0 0 1px rgba(255,255,255,0.08)`,
          transition: 'box-shadow 0.35s ease, background-color 0.35s ease',
        }}
      >
        {showShader ? (
          <Dithering
            width={size}
            height={size}
            colorBack={back}
            colorFront={front}
            shape="sphere"
            type="4x4"
            size={view.dotPx}
            scale={view.pulse}
            speed={view.shaderSpeed}
            frame={BASE_FRAME}
            fit="cover"
            minPixelRatio={2}
            webGlContextAttributes={GL_ATTRIBUTES}
          />
        ) : (
          <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}>
            {fallbackLayers.map((layer) => (
              <div
                key={layer.key}
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
                    backgroundImage: layer.dots,
                    backgroundSize: '6px 6px',
                    maskImage: 'radial-gradient(circle at 50% 42%, black 30%, transparent 75%)',
                    opacity: 'calc(0.3 + var(--orb-level, 0) * 0.7)',
                  }}
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            backgroundImage:
              'radial-gradient(circle at 31% 22%, rgba(255,255,255,0.4), transparent 14%), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.18), transparent 48%), radial-gradient(circle at 68% 76%, rgba(10,14,24,0.45), transparent 60%)',
          }}
        />
      </div>
    </div>
  );
};
