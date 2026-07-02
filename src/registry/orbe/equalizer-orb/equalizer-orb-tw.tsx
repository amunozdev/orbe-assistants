'use client';

import { useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const LAYERS = ['idle', 'active', 'wave', 'sweep', 'flat'] as const;

const BARS = [
  {
    h: '48%',
    gain: 0.55,
    hue: '-5deg',
    dur: '0.96s',
    delay: '-0.31s',
    ease: 'cubic-bezier(0.45, 0, 0.55, 1)',
    level: 'var(--orb-treble, 0)',
  },
  {
    h: '66%',
    gain: 0.7,
    hue: '-3deg',
    dur: '0.78s',
    delay: '-0.12s',
    ease: 'cubic-bezier(0.33, 0.72, 0.3, 1)',
    level: 'calc(0.55 * var(--orb-mid, 0) + 0.45 * var(--orb-treble, 0))',
  },
  {
    h: '86%',
    gain: 0.9,
    hue: '-1deg',
    dur: '1.08s',
    delay: '-0.54s',
    ease: 'cubic-bezier(0.6, 0.04, 0.4, 0.96)',
    level: 'calc(0.8 * var(--orb-mid, 0) + 0.2 * var(--orb-bass, 0))',
  },
  {
    h: '100%',
    gain: 1,
    hue: '0deg',
    dur: '0.72s',
    delay: '-0.2s',
    ease: 'cubic-bezier(0.45, 0, 0.55, 1)',
    level: 'calc(0.75 * var(--orb-bass, 0) + 0.25 * var(--orb-mid, 0))',
  },
  {
    h: '84%',
    gain: 0.88,
    hue: '1deg',
    dur: '0.9s',
    delay: '-0.66s',
    ease: 'cubic-bezier(0.33, 0.72, 0.3, 1)',
    level: 'calc(0.85 * var(--orb-mid, 0) + 0.15 * var(--orb-bass, 0))',
  },
  {
    h: '64%',
    gain: 0.72,
    hue: '3deg',
    dur: '0.84s',
    delay: '-0.4s',
    ease: 'cubic-bezier(0.6, 0.04, 0.4, 0.96)',
    level: 'calc(0.5 * var(--orb-mid, 0) + 0.5 * var(--orb-treble, 0))',
  },
  {
    h: '50%',
    gain: 0.55,
    hue: '5deg',
    dur: '1.02s',
    delay: '-0.09s',
    ease: 'cubic-bezier(0.45, 0, 0.55, 1)',
    level: 'calc(0.9 * var(--orb-treble, 0) + 0.1 * var(--orb-mid, 0))',
  },
] as const;

const EQ_TW_CSS = `
@property --etw-from { syntax: '<color>'; inherits: true; initial-value: #38bdf8; }
@property --etw-to { syntax: '<color>'; inherits: true; initial-value: #818cf8; }
@property --etw-ring { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --etw-breathe { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --etw-shake { syntax: '<number>'; inherits: true; initial-value: 0; }
[data-equalizer-orb-tw] {
  --etw-from: var(--orb-color-from);
  --etw-to: var(--orb-color-to);
  --etw-ring: 0;
  --etw-breathe: 0;
  --etw-shake: 0;
  --etw-ink: color-mix(in oklab, var(--etw-from) 45%, #0f172a);
  --etw-halo-mix: color-mix(in oklab, var(--etw-from), var(--etw-to) 60%);
  --etw-surface-hi: color-mix(in oklab, var(--etw-from) 10%, #ffffff);
  --etw-surface-lo: color-mix(in oklab, var(--etw-to) 16%, #e9edf7);
  --etw-rim: color-mix(in oklab, var(--etw-from) 38%, #b9c3d8);
  --etw-sheen: rgb(255 255 255 / 0.65);
  --etw-vignette: color-mix(in oklab, #0f172a, transparent 84%);
  --etw-glow-halo: color-mix(in oklab, var(--etw-halo-mix), transparent 35%);
  --etw-glow-core: color-mix(in oklab, var(--etw-from), transparent 25%);
  --etw-shadow-tint: color-mix(in oklab, var(--etw-ink), transparent 40%);
  --etw-shadow-tint-active: color-mix(in oklab, var(--etw-ink), transparent 28%);
  --etw-shadow-glow: transparent;
  --etw-shadow-glow-active: transparent;
  --etw-shadow:
    0 14px 28px -16px var(--etw-shadow-tint),
    0 0 26px -8px var(--etw-shadow-glow);
  --etw-shadow-active:
    0 16px 34px -16px var(--etw-shadow-tint-active),
    0 0 40px -6px var(--etw-shadow-glow-active);
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    --etw-from 0.35s ease,
    --etw-to 0.35s ease,
    --etw-ring 0.35s ease,
    --etw-breathe 0.35s ease,
    --etw-shake 0.35s ease;
}
@media (prefers-color-scheme: dark) {
  [data-equalizer-orb-tw] {
    --etw-surface-hi: color-mix(in oklab, var(--etw-from) 20%, #0b0e17);
    --etw-surface-lo: color-mix(in oklab, var(--etw-to) 11%, #05070d);
    --etw-rim: color-mix(in oklab, var(--etw-from) 42%, #141824);
    --etw-sheen: rgb(255 255 255 / 0.09);
    --etw-vignette: rgb(0 0 0 / 0.55);
    --etw-glow-halo: var(--etw-halo-mix);
    --etw-glow-core: var(--etw-from);
    --etw-shadow-tint: rgb(0 0 0 / 0.6);
    --etw-shadow-tint-active: rgb(0 0 0 / 0.55);
    --etw-shadow-glow: color-mix(in oklab, var(--etw-from), transparent 68%);
    --etw-shadow-glow-active: color-mix(in oklab, var(--etw-from), transparent 55%);
  }
}
@supports (color: light-dark(#fff, #000)) {
  [data-equalizer-orb-tw] {
    --etw-surface-hi: light-dark(
      color-mix(in oklab, var(--etw-from) 10%, #ffffff),
      color-mix(in oklab, var(--etw-from) 20%, #0b0e17)
    );
    --etw-surface-lo: light-dark(
      color-mix(in oklab, var(--etw-to) 16%, #e9edf7),
      color-mix(in oklab, var(--etw-to) 11%, #05070d)
    );
    --etw-rim: light-dark(
      color-mix(in oklab, var(--etw-from) 38%, #b9c3d8),
      color-mix(in oklab, var(--etw-from) 42%, #141824)
    );
    --etw-sheen: light-dark(rgb(255 255 255 / 0.65), rgb(255 255 255 / 0.09));
    --etw-vignette: light-dark(color-mix(in oklab, #0f172a, transparent 84%), rgb(0 0 0 / 0.55));
    --etw-glow-halo: light-dark(
      color-mix(in oklab, var(--etw-halo-mix), transparent 35%),
      var(--etw-halo-mix)
    );
    --etw-glow-core: light-dark(
      color-mix(in oklab, var(--etw-from), transparent 25%),
      var(--etw-from)
    );
    --etw-shadow-tint: light-dark(
      color-mix(in oklab, var(--etw-ink), transparent 40%),
      rgb(0 0 0 / 0.6)
    );
    --etw-shadow-tint-active: light-dark(
      color-mix(in oklab, var(--etw-ink), transparent 28%),
      rgb(0 0 0 / 0.55)
    );
    --etw-shadow-glow: light-dark(
      transparent,
      color-mix(in oklab, var(--etw-from), transparent 68%)
    );
    --etw-shadow-glow-active: light-dark(
      transparent,
      color-mix(in oklab, var(--etw-from), transparent 55%)
    );
  }
}
[data-equalizer-orb-tw][data-state='idle'] { --etw-breathe: 1; }
[data-equalizer-orb-tw][data-state='listening'] { --etw-ring: 1; }
[data-equalizer-orb-tw][data-state='error'] {
  --etw-from: ${ERROR_COLOR_FROM};
  --etw-to: ${ERROR_COLOR_TO};
  --etw-shake: 1;
}
[data-equalizer-orb-tw][data-state='disabled'] { opacity: 0.5; filter: grayscale(0.85); }
[data-equalizer-orb-tw] [data-eq-ring] {
  border: 1.5px solid color-mix(in oklab, var(--etw-from), var(--etw-to) 45%);
  opacity: calc(var(--etw-ring) * (0.18 + 0.6 * var(--orb-level, 0)));
  transform: scale(calc(0.94 + var(--etw-ring) * (0.025 + 0.05 * var(--orb-level, 0))));
}
[data-equalizer-orb-tw] [data-eq-disc] {
  background: radial-gradient(120% 120% at 50% 18%, var(--etw-surface-hi), var(--etw-surface-lo) 78%);
  box-shadow:
    inset 0 0 0 1px var(--etw-rim),
    var(--etw-shadow);
  transform: scale(calc(1 + 0.02 * var(--orb-level, 0)));
  transition: box-shadow 0.35s ease;
  animation: etw-breathe calc(4s / var(--orb-speed, 1)) ease-in-out infinite paused;
}
[data-equalizer-orb-tw][data-state='idle'] [data-eq-disc] { animation-play-state: running; }
[data-equalizer-orb-tw] [data-eq-disc]::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: 50%;
  background: radial-gradient(85% 55% at 50% 8%, var(--etw-sheen), transparent 62%);
  pointer-events: none;
}
[data-equalizer-orb-tw] [data-eq-disc]::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: 50%;
  background: radial-gradient(100% 100% at 50% 45%, transparent 58%, var(--etw-vignette));
  pointer-events: none;
}
[data-equalizer-orb-tw]:is([data-state='listening'], [data-state='speaking']) [data-eq-disc] {
  box-shadow:
    inset 0 0 0 1px var(--etw-rim),
    var(--etw-shadow-active);
}
[data-equalizer-orb-tw] [data-eq-halo] {
  background: radial-gradient(circle, var(--etw-glow-halo), transparent 70%);
  opacity: calc(0.16 + 0.4 * var(--orb-level, 0));
  transform: scale(calc(1 + 0.12 * var(--orb-level, 0)));
}
[data-equalizer-orb-tw] [data-eq-core] {
  background: radial-gradient(circle, var(--etw-glow-core), transparent 68%);
  opacity: calc(0.26 + 0.5 * var(--orb-level, 0));
  transform: scale(calc(1 + 0.2 * var(--orb-level, 0)));
}
[data-equalizer-orb-tw] [data-eq-bars] {
  -webkit-box-reflect: below 2px linear-gradient(to bottom, transparent 55%, rgb(0 0 0 / 0.3));
  animation: etw-shake calc(1.8s / var(--orb-speed, 1)) linear infinite paused;
}
[data-equalizer-orb-tw][data-state='error'] [data-eq-bars] { animation-play-state: running; }
[data-equalizer-orb-tw] [data-layer] {
  opacity: 0;
  transition: opacity 0.35s ease;
}
[data-equalizer-orb-tw]:is([data-state='idle'], [data-state='disabled']) [data-layer='idle'],
[data-equalizer-orb-tw]:is([data-state='listening'], [data-state='speaking']) [data-layer='active'],
[data-equalizer-orb-tw][data-state='thinking'] [data-layer='wave'],
[data-equalizer-orb-tw][data-state='connecting'] [data-layer='sweep'],
[data-equalizer-orb-tw][data-state='error'] [data-layer='flat'] { opacity: 1; }
[data-equalizer-orb-tw] [data-bar] {
  --etw-dot: calc(var(--orb-size) * (0.013 + 0.006 * var(--bar-gain)));
  --etw-lo: calc((7% + 9% * var(--bar-level)) * var(--bar-gain));
  --etw-mid: calc((14% + 22% * var(--bar-level)) * var(--bar-gain));
  --etw-mh: calc((17% + 28% * var(--bar-level)) * var(--bar-gain));
  --etw-hi: calc((20% + 34% * var(--bar-level)) * var(--bar-gain));
  --etw-cn: calc((13% + 24% * var(--bar-level)) * (0.7 + 0.3 * var(--bar-gain)));
  background: linear-gradient(
    to top,
    var(--etw-from),
    color-mix(in oklab, var(--etw-from), var(--etw-to) 55%) 55%,
    color-mix(in oklab, var(--etw-to), white 30%)
  );
  filter: hue-rotate(var(--bar-hue));
  clip-path: inset(calc(50% - var(--etw-dot)) 0 round 999px);
}
[data-equalizer-orb-tw] [data-layer='flat'] [data-bar] {
  clip-path: inset(calc(50% - var(--orb-size) * 0.012) 0 round 999px);
}
[data-equalizer-orb-tw] [data-layer='active'] [data-bar] {
  animation-duration: calc(var(--bar-dur) / var(--orb-speed, 1));
  animation-delay: calc(var(--bar-delay) / var(--orb-speed, 1));
  animation-timing-function: var(--bar-ease);
  animation-iteration-count: infinite;
  animation-play-state: paused;
}
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='1'] { animation-name: etw-b; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='2'] { animation-name: etw-a; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='3'] { animation-name: etw-c; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='4'] { animation-name: etw-a; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='5'] { animation-name: etw-b; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='6'] { animation-name: etw-c; }
[data-equalizer-orb-tw] [data-layer='active'] [data-bar='7'] { animation-name: etw-a; }
[data-equalizer-orb-tw] [data-layer='wave'] [data-bar] {
  animation: etw-wave calc(2.4s / var(--orb-speed, 1)) cubic-bezier(0.45, 0, 0.55, 1)
    calc(var(--bar-i) * -0.3s / var(--orb-speed, 1)) infinite paused;
}
[data-equalizer-orb-tw] [data-layer='sweep'] [data-bar] {
  animation: etw-connect calc(1.6s / var(--orb-speed, 1)) ease-in-out
    calc(var(--bar-i) * 0.09s / var(--orb-speed, 1)) infinite both paused;
}
[data-equalizer-orb-tw]:is([data-state='listening'], [data-state='speaking']) [data-layer='active'] [data-bar],
[data-equalizer-orb-tw][data-state='thinking'] [data-layer='wave'] [data-bar],
[data-equalizer-orb-tw][data-state='connecting'] [data-layer='sweep'] [data-bar] {
  animation-play-state: running;
}
@keyframes etw-a {
  0%, 100% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
  30% { clip-path: inset(calc(50% - var(--etw-hi)) 0 round 999px); }
  55% { clip-path: inset(calc(50% - var(--etw-mid)) 0 round 999px); }
  80% { clip-path: inset(calc(50% - var(--etw-mh)) 0 round 999px); }
}
@keyframes etw-b {
  0%, 100% { clip-path: inset(calc(50% - var(--etw-mid)) 0 round 999px); }
  30% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
  55% { clip-path: inset(calc(50% - var(--etw-hi)) 0 round 999px); }
  78% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
}
@keyframes etw-c {
  0%, 100% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
  25% { clip-path: inset(calc(50% - var(--etw-mid)) 0 round 999px); }
  52% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
  80% { clip-path: inset(calc(50% - var(--etw-hi)) 0 round 999px); }
}
@keyframes etw-wave {
  0%, 100% { clip-path: inset(calc(50% - var(--etw-lo)) 0 round 999px); }
  50% { clip-path: inset(calc(50% - var(--etw-mh)) 0 round 999px); }
}
@keyframes etw-connect {
  0%, 26%, 100% { clip-path: inset(calc(50% - var(--etw-dot)) 0 round 999px); }
  12% { clip-path: inset(calc(50% - var(--etw-cn)) 0 round 999px); }
}
@keyframes etw-breathe {
  0%, 100% { transform: scale(calc(1 + 0.02 * var(--orb-level, 0))); }
  50% { transform: scale(calc(1 + 0.02 * var(--orb-level, 0) + 0.02 * var(--etw-breathe))); }
}
@keyframes etw-shake {
  0%, 22%, 100% { transform: translateX(0); }
  4% { transform: translateX(calc(-1.5px * var(--etw-shake))); }
  9% { transform: translateX(calc(1.5px * var(--etw-shake))); }
  14% { transform: translateX(calc(-1px * var(--etw-shake))); }
  18% { transform: translateX(calc(1px * var(--etw-shake))); }
}
@media (prefers-reduced-motion: reduce) {
  [data-equalizer-orb-tw],
  [data-equalizer-orb-tw] * { animation: none !important; }
  [data-equalizer-orb-tw] [data-eq-ring] {
    opacity: calc(var(--etw-ring) * 0.55);
    transform: scale(calc(0.94 + 0.06 * var(--etw-ring)));
  }
  [data-equalizer-orb-tw] [data-layer='sweep'] [data-bar] {
    clip-path: inset(calc(50% - (6% + 9% * var(--bar-gain))) 0 round 999px);
  }
  [data-equalizer-orb-tw] [data-layer='wave'] [data-bar] {
    clip-path: inset(calc(50% - (9% + 16% * var(--bar-gain))) 0 round 999px);
  }
  [data-equalizer-orb-tw] [data-layer='active'] [data-bar] {
    clip-path: inset(calc(50% - (11% + 27% * var(--bar-gain))) 0 round 999px);
  }
}
`;

export const EqualizerOrbTw = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#38bdf8',
  colorTo = '#818cf8',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  useOrbLevel(innerRef, state, levelRef);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
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
      data-equalizer-orb-tw=""
      className={clsx('relative isolate grid place-items-center', className)}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
      }}
    >
      <style>{EQ_TW_CSS}</style>
      <span data-eq-ring="" className="absolute inset-0 z-0 rounded-full" />
      <span
        data-eq-disc=""
        className="absolute inset-[3.5%] z-[1] grid place-items-center overflow-hidden rounded-full"
      >
        <span
          data-eq-halo=""
          className="absolute z-0 h-[86%] w-[86%] rounded-full blur-[24px] will-change-[transform,opacity]"
        />
        <span
          data-eq-core=""
          className="absolute z-[1] h-[44%] w-[44%] rounded-full blur-[6px] will-change-[transform,opacity]"
        />
        <span data-eq-bars="" className="relative z-[2] grid h-[58%] w-[68%]">
          {LAYERS.map((layer) => (
            <span
              key={layer}
              data-layer={layer}
              className="col-start-1 row-start-1 flex h-full w-full items-center justify-center gap-[6%]"
            >
              {BARS.map((bar, index) => (
                <span
                  key={bar.delay}
                  data-bar={index + 1}
                  className="w-[8%] rounded-full"
                  style={
                    {
                      height: bar.h,
                      '--bar-level': bar.level,
                      '--bar-gain': `${bar.gain}`,
                      '--bar-hue': bar.hue,
                      '--bar-i': `${index}`,
                      '--bar-dur': bar.dur,
                      '--bar-delay': bar.delay,
                      '--bar-ease': bar.ease,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
};
