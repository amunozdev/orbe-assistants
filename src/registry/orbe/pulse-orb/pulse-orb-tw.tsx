'use client';

import { useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const RINGS = [
  { base: 2.7, delay: 0, scale: 2.1, mix: 72 },
  { base: 3.1, delay: -1.1, scale: 2.3, mix: 40 },
  { base: 3.6, delay: -2.3, scale: 2.5, mix: 12 },
] as const;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")`;

const PULSE_TW_CSS = `
[data-pulse-orb-tw] [data-glow] {
  background:
    radial-gradient(48% 48% at 36% 32%, color-mix(in oklab, var(--orb-color-from), transparent 22%), transparent 70%),
    radial-gradient(52% 52% at 66% 70%, color-mix(in oklab, var(--orb-color-to), transparent 28%), transparent 72%);
  background:
    radial-gradient(48% 48% at 36% 32%, light-dark(color-mix(in oklab, var(--orb-color-from), transparent 10%), color-mix(in oklab, var(--orb-color-from), transparent 30%)), transparent 70%),
    radial-gradient(52% 52% at 66% 70%, light-dark(color-mix(in oklab, var(--orb-color-to), transparent 16%), color-mix(in oklab, var(--orb-color-to), transparent 36%)), transparent 72%);
}
@keyframes pulse-orb-tw-emit {
  0% { transform: scale(1); opacity: 0; }
  14% { opacity: calc(var(--ptw-ring-alpha, 1) * (0.4 + 0.5 * var(--orb-level, 0))); }
  100% { transform: scale(var(--ptw-ring-scale, 2.3)); opacity: 0; }
}
@keyframes pulse-orb-tw-spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse-orb-tw-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes pulse-orb-tw-blink {
  0%, 26%, 100% { opacity: 1; }
  7%, 20% { opacity: 0.35; }
  13% { opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  [data-pulse-orb-tw],
  [data-pulse-orb-tw] * { animation: none !important; }
  [data-pulse-orb-tw] [data-ring='1'] { transform: scale(1.2) !important; opacity: 0.3 !important; }
  [data-pulse-orb-tw] [data-ring='2'] { transform: scale(1.5) !important; opacity: 0.2 !important; }
  [data-pulse-orb-tw] [data-ring='3'] { transform: scale(1.8) !important; opacity: 0.1 !important; }
  [data-pulse-orb-tw] [data-arc] { opacity: 0.6 !important; }
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
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const isError = state === 'error';
  const from = isError ? '#fb7185' : colorFrom;
  const to = isError ? '#f43f5e' : colorTo;
  const showArc = state === 'connecting' || state === 'thinking';
  const showRings = state === 'idle' || state === 'listening' || state === 'speaking';
  const ringTime = state === 'speaking' ? 0.667 : state === 'idle' ? 1.85 : 0.9;
  const ringDir = state === 'listening' ? 'reverse' : 'normal';
  const glowAlpha = state === 'connecting' ? 0.6 : state === 'disabled' ? 0.4 : 1;
  const breatheSec = state === 'idle' ? 4 : state === 'thinking' ? 3 : 0;
  const coreAnimation = breatheSec
    ? `pulse-orb-tw-breathe calc(${breatheSec}s / var(--orb-speed)) ease-in-out infinite`
    : isError
      ? 'pulse-orb-tw-blink calc(1.8s / var(--orb-speed)) ease-in-out infinite'
      : undefined;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      data-pulse-orb-tw=""
      className={clsx(
        'relative isolate grid place-items-center',
        state === 'disabled' && 'opacity-50 grayscale-[0.8]',
        className,
      )}
      style={
        {
          ...orbVars({ size, speed, colorFrom: from, colorTo: to }),
          width: size,
          height: size,
          '--ptw-ring-alpha': state === 'idle' ? '0.45' : '1',
        } as CSSProperties
      }
    >
      <style>{PULSE_TW_CSS}</style>
      <span
        data-glow=""
        className="absolute h-[82%] w-[82%] rounded-full blur-[18px] will-change-[transform,opacity]"
        style={{
          opacity: `calc(${glowAlpha} * (0.5 + 0.5 * var(--orb-level, 0)))`,
          transform: 'scale(calc(0.95 + 0.22 * var(--orb-level, 0)))',
        }}
      />
      {showRings &&
        RINGS.map((ring, index) => (
          <span
            key={ring.base}
            data-ring={index + 1}
            className="absolute h-[42%] w-[42%] rounded-full opacity-0"
            style={
              {
                border: `1.5px solid color-mix(in oklab, ${from} ${ring.mix}%, ${to})`,
                animation: `pulse-orb-tw-emit calc(${(ring.base * ringTime).toFixed(2)}s / var(--orb-speed)) cubic-bezier(0.16, 0.84, 0.44, 1) calc(${(ring.delay * ringTime).toFixed(2)}s / var(--orb-speed)) infinite ${ringDir}`,
                '--ptw-ring-scale': `${ring.scale}`,
              } as CSSProperties
            }
          />
        ))}
      {showArc && (
        <span
          data-arc=""
          className="absolute h-[54%] w-[54%]"
          style={{
            opacity: state === 'connecting' ? 0.75 : 1,
            animation: `pulse-orb-tw-spin calc(${state === 'connecting' ? 2.4 : 1.6}s / var(--orb-speed)) linear infinite`,
          }}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg in oklab, transparent 55deg, color-mix(in oklab, ${from}, transparent 78%) 140deg, color-mix(in oklab, ${from} 45%, ${to}) 250deg, ${to} 354deg, transparent 355deg)`,
              WebkitMask:
                'radial-gradient(closest-side, transparent 89%, #000 93%, #000 96.5%, transparent 100%)',
              mask: 'radial-gradient(closest-side, transparent 89%, #000 93%, #000 96.5%, transparent 100%)',
            }}
          />
          <span
            className="absolute left-1/2 top-[2.75%] h-[6.5%] w-[6.5%] rounded-full"
            style={{
              background: to,
              boxShadow: `0 0 6px color-mix(in oklab, ${to}, transparent 25%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </span>
      )}
      <span
        className="absolute h-[42%] w-[42%] rounded-full will-change-transform"
        style={{
          background: `radial-gradient(120% 120% at 32% 28% in oklab, color-mix(in oklab, ${from}, white 60%) 0%, ${from} 30%, ${to} 78%, color-mix(in oklab, ${to}, black 35%) 100%)`,
          boxShadow: `inset -6px -10px 18px color-mix(in oklab, ${to}, black 60%), inset 3px 5px 10px color-mix(in oklab, white, transparent 60%), 0 10px 26px -10px color-mix(in oklab, ${to}, transparent 55%)`,
          transform: 'scale(calc(1 + 0.14 * var(--orb-level, 0)))',
          animation: coreAnimation,
          filter: state === 'connecting' ? 'saturate(0.75) brightness(0.98)' : undefined,
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
    </div>
  );
};
