'use client';

import { useCallback, useRef } from 'react';
import clsx from 'clsx';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const MINIMAL_TW_CSS = `
@property --mtw-from { syntax: '<color>'; inherits: true; initial-value: #818cf8; }
@property --mtw-to { syntax: '<color>'; inherits: true; initial-value: #a5b4fc; }
@property --mtw-breathe { syntax: '<number>'; inherits: true; initial-value: 1; }
@property --mtw-pulse { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --mtw-mark { syntax: '<number>'; inherits: true; initial-value: 0; }
[data-minimal-orb-tw] {
  --mtw-from: var(--orb-color-from);
  --mtw-to: var(--orb-color-to);
  --mtw-breathe: 1;
  --mtw-pulse: 0;
  --mtw-mark: 0;
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    --mtw-from 0.45s ease,
    --mtw-to 0.45s ease,
    --mtw-breathe 0.5s ease,
    --mtw-pulse 0.45s ease,
    --mtw-mark 0.3s ease;
}
[data-minimal-orb-tw][data-state='connecting'] {
  --mtw-breathe: 0;
  --mtw-pulse: 1;
  --mtw-from: color-mix(in oklab, var(--orb-color-from) 70%, #94a3b8);
  --mtw-to: color-mix(in oklab, var(--orb-color-to) 70%, #94a3b8);
}
[data-minimal-orb-tw][data-state='listening'] { --mtw-breathe: 0; }
[data-minimal-orb-tw][data-state='speaking'] {
  --mtw-breathe: 0;
  --mtw-from: color-mix(in oklab, var(--orb-color-from) 86%, white);
  --mtw-to: color-mix(in oklab, var(--orb-color-to) 86%, white);
}
[data-minimal-orb-tw][data-state='error'] {
  --mtw-breathe: 0;
  --mtw-mark: 1;
  --mtw-from: color-mix(in oklab, ${ERROR_COLOR_FROM} 68%, #9ca3af);
  --mtw-to: color-mix(in oklab, ${ERROR_COLOR_TO} 68%, #9ca3af);
}
[data-minimal-orb-tw][data-state='disabled'] {
  --mtw-breathe: 0;
  filter: grayscale(1);
  opacity: 0.45;
}
[data-minimal-orb-tw][data-state='error'] [data-shaker] {
  animation: minimal-orb-tw-shake 0.45s ease-out 1;
}
[data-minimal-orb-tw] [data-disc] {
  border: 1px solid light-dark(
    color-mix(in oklab, var(--mtw-to), black 22%),
    color-mix(in oklab, var(--mtw-from), transparent 55%)
  );
  scale: calc(1 + 0.055 * var(--orb-level, 0));
  animation:
    minimal-orb-tw-breathe calc(4.4s / var(--orb-speed, 1)) ease-in-out infinite,
    minimal-orb-tw-settle calc(2.8s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-minimal-orb-tw] [data-spin] {
  animation: minimal-orb-tw-turn calc(90s / var(--orb-speed, 1)) linear infinite;
}
[data-minimal-orb-tw] [data-spin-turbo] {
  background: linear-gradient(135deg, var(--mtw-from), var(--mtw-to));
  animation: minimal-orb-tw-turn calc(18s / var(--orb-speed, 1)) linear infinite;
  animation-play-state: paused;
}
[data-minimal-orb-tw][data-state='thinking'] [data-spin-turbo] {
  animation-play-state: running;
}
[data-minimal-orb-tw] [data-mark] {
  background: color-mix(in oklab, white 84%, var(--mtw-from));
  opacity: calc(0.9 * var(--mtw-mark));
}
@keyframes minimal-orb-tw-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(calc(1 + 0.035 * var(--mtw-breathe))); }
}
@keyframes minimal-orb-tw-settle {
  0%, 100% { opacity: 1; }
  50% { opacity: calc(1 - 0.12 * var(--mtw-pulse)); }
}
@keyframes minimal-orb-tw-turn {
  to { transform: rotate(360deg); }
}
@keyframes minimal-orb-tw-shake {
  0% { transform: translateX(0); }
  18% { transform: translateX(-2.5%); }
  42% { transform: translateX(3%); }
  66% { transform: translateX(-1.8%); }
  84% { transform: translateX(0.8%); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  [data-minimal-orb-tw] [data-disc],
  [data-minimal-orb-tw] [data-spin],
  [data-minimal-orb-tw] [data-spin-turbo],
  [data-minimal-orb-tw][data-state='error'] [data-shaker] {
    animation: none;
  }
}
`;

export const MinimalOrbTw = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#a5b4fc',
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
      data-minimal-orb-tw=""
      className={clsx('relative isolate grid place-items-center', className)}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
      }}
    >
      <style>{MINIMAL_TW_CSS}</style>
      <span data-shaker="" className="absolute grid h-[60%] w-[60%] place-items-center">
        <span
          data-disc=""
          className="absolute inset-0 overflow-hidden rounded-full will-change-[transform,opacity]"
        >
          <span data-spin="" className="absolute -inset-[28%]">
            <span data-spin-turbo="" className="absolute inset-0" />
          </span>
        </span>
        <span data-mark="" className="absolute h-[4%] w-[18%] rounded-full" />
      </span>
    </div>
  );
};
