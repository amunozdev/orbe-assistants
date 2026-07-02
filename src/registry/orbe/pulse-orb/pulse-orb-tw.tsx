'use client';

import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const RINGS = [
  { base: 2.7, delay: 0, scale: 2.1, mix: 72 },
  { base: 3.1, delay: -1.1, scale: 2.3, mix: 40 },
  { base: 3.6, delay: -2.3, scale: 2.5, mix: 12 },
] as const;

const RING_SETS = [
  { name: 'idle', time: 1.85, dir: 'normal' },
  { name: 'listen', time: 0.9, dir: 'reverse' },
  { name: 'speak', time: 0.667, dir: 'normal' },
] as const;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")`;

const PULSE_TW_CSS = `
@property --ptw-from { syntax: '<color>'; inherits: true; initial-value: #818cf8; }
@property --ptw-to { syntax: '<color>'; inherits: true; initial-value: #22d3ee; }
@property --ptw-glow { syntax: '<number>'; inherits: true; initial-value: 1; }
@property --ptw-breathe-idle { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --ptw-breathe-think { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --ptw-blink { syntax: '<number>'; inherits: true; initial-value: 0; }
[data-pulse-orb-tw] {
  --ptw-from: var(--orb-color-from);
  --ptw-to: var(--orb-color-to);
  --ptw-glow: 1;
  --ptw-breathe-idle: 0;
  --ptw-breathe-think: 0;
  --ptw-blink: 0;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    --ptw-from 0.35s ease,
    --ptw-to 0.35s ease,
    --ptw-glow 0.35s ease,
    --ptw-breathe-idle 0.45s ease,
    --ptw-breathe-think 0.45s ease,
    --ptw-blink 0.3s ease;
}
[data-pulse-orb-tw][data-state='idle'] { --ptw-breathe-idle: 1; }
[data-pulse-orb-tw][data-state='thinking'] { --ptw-breathe-think: 1; }
[data-pulse-orb-tw][data-state='connecting'] { --ptw-glow: 0.6; }
[data-pulse-orb-tw][data-state='error'] { --ptw-from: ${ERROR_COLOR_FROM}; --ptw-to: ${ERROR_COLOR_TO}; --ptw-blink: 1; }
[data-pulse-orb-tw][data-state='disabled'] { --ptw-glow: 0.4; filter: grayscale(0.8); opacity: 0.5; }
[data-pulse-orb-tw] [data-glow] {
  background:
    radial-gradient(48% 48% at 36% 32%, color-mix(in oklab, var(--ptw-from), transparent 22%), transparent 70%),
    radial-gradient(52% 52% at 66% 70%, color-mix(in oklab, var(--ptw-to), transparent 28%), transparent 72%);
  background:
    radial-gradient(48% 48% at 36% 32%, light-dark(color-mix(in oklab, var(--ptw-from), transparent 10%), color-mix(in oklab, var(--ptw-from), transparent 30%)), transparent 70%),
    radial-gradient(52% 52% at 66% 70%, light-dark(color-mix(in oklab, var(--ptw-to), transparent 16%), color-mix(in oklab, var(--ptw-to), transparent 36%)), transparent 72%);
  opacity: calc(var(--ptw-glow) * (0.5 + 0.5 * var(--orb-level, 0)));
}
[data-pulse-orb-tw] [data-ring-set] {
  opacity: 0;
  transition: opacity 0.4s ease;
}
[data-pulse-orb-tw][data-state='idle'] [data-ring-set='idle'] { opacity: 0.45; }
[data-pulse-orb-tw][data-state='listening'] [data-ring-set='listen'] { opacity: 1; }
[data-pulse-orb-tw][data-state='speaking'] [data-ring-set='speak'] { opacity: 1; }
[data-pulse-orb-tw] [data-ring] {
  animation: pulse-orb-tw-emit calc(var(--ptw-ring-base) * var(--ptw-ring-time, 1) / var(--orb-speed, 1)) cubic-bezier(0.16, 0.84, 0.44, 1) calc(var(--ptw-ring-delay) * var(--ptw-ring-time, 1) / var(--orb-speed, 1)) infinite var(--ptw-ring-dir, normal);
}
[data-pulse-orb-tw] [data-arc] {
  opacity: 0;
  transition: opacity 0.4s ease;
}
[data-pulse-orb-tw][data-state='connecting'] [data-arc] { opacity: 0.75; }
[data-pulse-orb-tw][data-state='thinking'] [data-arc] { opacity: 1; }
[data-pulse-orb-tw] [data-arc-spin] {
  animation: pulse-orb-tw-spin calc(2.4s / var(--orb-speed, 1)) linear infinite;
}
[data-pulse-orb-tw] [data-arc-turbo] {
  animation: pulse-orb-tw-spin calc(4.8s / var(--orb-speed, 1)) linear infinite;
  animation-play-state: paused;
}
[data-pulse-orb-tw][data-state='thinking'] [data-arc-turbo] { animation-play-state: running; }
[data-pulse-orb-tw] [data-core-shell] {
  animation: pulse-orb-tw-breathe-think calc(3s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-pulse-orb-tw] [data-core] {
  scale: calc(1 + 0.14 * var(--orb-level, 0));
  animation:
    pulse-orb-tw-breathe-idle calc(4s / var(--orb-speed, 1)) ease-in-out infinite,
    pulse-orb-tw-blink calc(1.8s / var(--orb-speed, 1)) ease-in-out infinite;
  transition: filter 0.35s ease;
}
[data-pulse-orb-tw][data-state='connecting'] [data-core] { filter: saturate(0.75) brightness(0.98); }
@keyframes pulse-orb-tw-emit {
  0% { transform: scale(1); opacity: 0; }
  14% { opacity: calc(0.4 + 0.5 * var(--orb-level, 0)); }
  100% { transform: scale(var(--ptw-ring-scale, 2.3)); opacity: 0; }
}
@keyframes pulse-orb-tw-spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse-orb-tw-breathe-idle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(calc(1 + 0.05 * var(--ptw-breathe-idle))); }
}
@keyframes pulse-orb-tw-breathe-think {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(calc(1 + 0.05 * var(--ptw-breathe-think))); }
}
@keyframes pulse-orb-tw-blink {
  0%, 26%, 100% { opacity: 1; }
  7%, 20% { opacity: calc(1 - 0.65 * var(--ptw-blink)); }
  13% { opacity: calc(1 - 0.1 * var(--ptw-blink)); }
}
@media (prefers-reduced-motion: reduce) {
  [data-pulse-orb-tw],
  [data-pulse-orb-tw] * { animation: none !important; }
  [data-pulse-orb-tw][data-state='listening'] [data-ring-set='listen'],
  [data-pulse-orb-tw][data-state='speaking'] [data-ring-set='speak'] { opacity: 1; }
  [data-pulse-orb-tw][data-state='idle'] [data-ring-set='idle'] { opacity: 0.5; }
  [data-pulse-orb-tw] [data-ring='1'] { transform: scale(1.2); opacity: 0.3; }
  [data-pulse-orb-tw] [data-ring='2'] { transform: scale(1.5); opacity: 0.2; }
  [data-pulse-orb-tw] [data-ring='3'] { transform: scale(1.8); opacity: 0.1; }
  [data-pulse-orb-tw][data-state='speaking'] [data-ring='1'] { transform: scale(1.35); opacity: 0.5; }
  [data-pulse-orb-tw][data-state='speaking'] [data-ring='2'] { transform: scale(1.7); opacity: 0.34; }
  [data-pulse-orb-tw][data-state='speaking'] [data-ring='3'] { transform: scale(2.05); opacity: 0.18; }
  [data-pulse-orb-tw][data-state='connecting'] [data-arc] { opacity: 0.45; }
  [data-pulse-orb-tw][data-state='thinking'] [data-arc] { opacity: 0.9; }
}
`;

export const PulseOrbTw = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
  useOrbLevel(internalRef, state, levelRef);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <div
      ref={setRef}
      role="img"
      aria-label={label}
      data-state={state}
      data-pulse-orb-tw=""
      className={clsx('relative isolate grid place-items-center', className)}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
      }}
    >
      <style>{PULSE_TW_CSS}</style>
      <span
        data-glow=""
        className="absolute h-[82%] w-[82%] rounded-full blur-[18px] will-change-[transform,opacity]"
        style={{ transform: 'scale(calc(0.95 + 0.22 * var(--orb-level, 0)))' }}
      />
      {RING_SETS.map((set) => (
        <span
          key={set.name}
          data-ring-set={set.name}
          className="absolute inset-0 grid place-items-center"
          style={
            {
              '--ptw-ring-time': `${set.time}`,
              '--ptw-ring-dir': set.dir,
            } as CSSProperties
          }
        >
          {RINGS.map((ring, index) => (
            <span
              key={ring.base}
              data-ring={index + 1}
              className="absolute h-[42%] w-[42%] rounded-full opacity-0"
              style={
                {
                  border: `1.5px solid color-mix(in oklab, var(--ptw-from) ${ring.mix}%, var(--ptw-to))`,
                  '--ptw-ring-base': `${ring.base}s`,
                  '--ptw-ring-delay': `${ring.delay}s`,
                  '--ptw-ring-scale': `${ring.scale}`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      ))}
      <span data-arc="" className="absolute h-[54%] w-[54%]">
        <span data-arc-spin="" className="absolute inset-0">
          <span data-arc-turbo="" className="absolute inset-0">
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg in oklab, transparent 55deg, color-mix(in oklab, var(--ptw-from), transparent 78%) 140deg, color-mix(in oklab, var(--ptw-from) 45%, var(--ptw-to)) 250deg, var(--ptw-to) 354deg, transparent 355deg)',
                WebkitMask:
                  'radial-gradient(closest-side, transparent 89%, #000 93%, #000 96.5%, transparent 100%)',
                mask: 'radial-gradient(closest-side, transparent 89%, #000 93%, #000 96.5%, transparent 100%)',
              }}
            />
            <span
              className="absolute left-1/2 top-[2.75%] h-[6.5%] w-[6.5%] rounded-full"
              style={{
                background: 'var(--ptw-to)',
                boxShadow: '0 0 6px color-mix(in oklab, var(--ptw-to), transparent 25%)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </span>
        </span>
      </span>
      <span data-core-shell="" className="absolute h-[42%] w-[42%] will-change-transform">
        <span
          data-core=""
          className="absolute inset-0 rounded-full will-change-transform"
          style={{
            background:
              'radial-gradient(120% 120% at 32% 28% in oklab, color-mix(in oklab, var(--ptw-from), white 60%) 0%, var(--ptw-from) 30%, var(--ptw-to) 78%, color-mix(in oklab, var(--ptw-to), black 35%) 100%)',
            boxShadow:
              'inset -6px -10px 18px color-mix(in oklab, var(--ptw-to), black 60%), inset 3px 5px 10px color-mix(in oklab, white, transparent 60%), 0 10px 26px -10px color-mix(in oklab, var(--ptw-to), transparent 55%)',
          }}
        >
          <span
            className="absolute left-[16%] top-[10%] h-[26%] w-[40%] rounded-full blur-[1px]"
            style={{
              background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.9), transparent)',
              transform: 'rotate(-20deg)',
            }}
          />
          <span
            className="absolute inset-0 rounded-full opacity-10 mix-blend-overlay"
            style={{ background: GRAIN }}
          />
        </span>
      </span>
    </div>
  );
};
