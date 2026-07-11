'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { LiquidMetal } from '@paper-design/shaders-react';
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
const MOTION_RATE = 6;
const SPEED_RATE = 5;
const ERROR_RATE = 6;
const STATIC_PHASE = 0.9;
const STRIPE_ANGLE = 70;

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
            ? 0.5
            : 0.32;

interface RippleTarget {
  distortion: number;
  contour: number;
  repetition: number;
  softness: number;
}

const rippleFor = (s: OrbState, energy: number): RippleTarget => {
  switch (s) {
    case 'listening':
    case 'speaking':
      return {
        distortion: Math.min(1, 0.12 + energy * 0.5),
        contour: Math.min(1, 0.45 + energy * 0.5),
        repetition: 2.6 + energy * 2.4,
        softness: 0.14,
      };
    case 'thinking':
      return {
        distortion: 0.3,
        contour: Math.min(1, 0.55 + energy * 0.25),
        repetition: 3.4,
        softness: 0.22,
      };
    case 'connecting':
      return {
        distortion: 0.1 + energy * 0.3,
        contour: 0.35 + energy * 0.4,
        repetition: 2.2,
        softness: 0.3,
      };
    case 'error':
      return { distortion: 0.65, contour: 0.9, repetition: 4.2, softness: 0.08 };
    case 'disabled':
      return { distortion: 0.04, contour: 0.25, repetition: 2, softness: 0.4 };
    default:
      return { distortion: 0.08, contour: 0.42, repetition: 2.4, softness: 0.26 };
  }
};

const shaderSpeedFor = (s: OrbState, multiplier: number) =>
  s === 'disabled' ? 0 : speedFor(s) * multiplier;

interface OrbMotionValues {
  energy: number;
  distortion: number;
  contour: number;
  repetition: number;
  softness: number;
  shaderSpeed: number;
  errorMix: number;
}

const motionSeed = (s: OrbState, multiplier: number): OrbMotionValues => ({
  energy: 0,
  ...rippleFor(s, 0),
  shaderSpeed: shaderSpeedFor(s, multiplier),
  errorMix: s === 'error' ? 1 : 0,
});

const quantize = (value: number, steps: number) => Math.round(value * steps) / steps;

const sameMotion = (a: OrbMotionValues, b: OrbMotionValues) =>
  a.energy === b.energy &&
  a.distortion === b.distortion &&
  a.contour === b.contour &&
  a.repetition === b.repetition &&
  a.softness === b.softness &&
  a.shaderSpeed === b.shaderSpeed &&
  a.errorMix === b.errorMix;

export const MercuryOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#cbd5e1',
  colorTo = '#a5b4fc',
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
  const [motion, setMotion] = useState<OrbMotionValues>(() => motionSeed(state, speed));
  const accRef = useRef<OrbMotionValues | null>(null);

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
      const target = rippleFor(current, acc.energy);
      acc.distortion = approach(acc.distortion, target.distortion, MOTION_RATE, dt);
      acc.contour = approach(acc.contour, target.contour, MOTION_RATE, dt);
      acc.repetition = approach(acc.repetition, target.repetition, MOTION_RATE, dt);
      acc.softness = approach(acc.softness, target.softness, MOTION_RATE, dt);
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
        const next: OrbMotionValues = {
          energy: quantize(acc.energy, 50),
          distortion: quantize(acc.distortion, 100),
          contour: quantize(acc.contour, 100),
          repetition: quantize(acc.repetition, 50),
          softness: quantize(acc.softness, 100),
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
  const view: OrbMotionValues = reduced
    ? {
        energy: staticLevel,
        ...rippleFor(state, staticLevel),
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
  const core = mixHex(from, to, 0.5);
  const backColor = shade(core, 0.72);
  const tintColor = tint(core, 0.2);
  const fallbackLayers = [
    { key: 'brand', from: colorFrom, to: colorTo, visible: state !== 'error' },
    { key: 'error', from: ERROR_COLOR_FROM, to: ERROR_COLOR_TO, visible: state === 'error' },
  ].map(({ key, from: f, to: t, visible }) => ({
    key,
    visible,
    base: `radial-gradient(circle at 50% 38%, ${tint(f, 0.5)}, ${mixHex(f, t, 0.5)} 45%, ${shade(t, 0.55)} 100%)`,
    sheen: `conic-gradient(from 210deg at 50% 50%, transparent 0deg, ${tint(t, 0.65)} 40deg, transparent 90deg, ${tint(f, 0.4)} 180deg, transparent 240deg, ${tint(t, 0.5)} 300deg, transparent 360deg)`,
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
            ? Math.min(1, 0.3 + view.energy * 0.6)
            : 'calc(0.3 + var(--orb-level, 0) * 0.6)',
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
          backgroundColor: backColor,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${from} 40%, transparent), 0 0 0 1px rgba(255,255,255,0.08)`,
          transition: 'box-shadow 0.35s ease, background-color 0.35s ease',
        }}
      >
        {showShader ? (
          <LiquidMetal
            width={size}
            height={size}
            shape="circle"
            scale={1.05}
            colorBack={backColor}
            colorTint={tintColor}
            repetition={view.repetition}
            softness={view.softness}
            shiftRed={0.3 + view.errorMix * 0.3}
            shiftBlue={0.3 - view.errorMix * 0.3}
            distortion={view.distortion}
            contour={view.contour}
            angle={STRIPE_ANGLE}
            speed={view.shaderSpeed}
            frame={BASE_FRAME}
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
                    backgroundImage: layer.sheen,
                    opacity: 'calc(0.2 + var(--orb-level, 0) * 0.7)',
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
              'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.5), transparent 16%), radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22), transparent 46%), radial-gradient(circle at 68% 78%, rgba(8,12,20,0.45), transparent 58%)',
          }}
        />
      </div>
    </div>
  );
};
