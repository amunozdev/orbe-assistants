'use client';

import { useCallback, useRef } from 'react';
import clsx from 'clsx';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.05'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E")`;

const AURORA_TW_CSS = `
@property --atw-sky-hi { syntax: '<color>'; inherits: true; initial-value: #16223c; }
@property --atw-sky-top { syntax: '<color>'; inherits: true; initial-value: #0d1526; }
@property --atw-sky-mid { syntax: '<color>'; inherits: true; initial-value: #0a111f; }
@property --atw-sky-low { syntax: '<color>'; inherits: true; initial-value: #04070e; }
@property --atw-hi { syntax: '<color>'; inherits: true; initial-value: #eafff6; }
@property --atw-green { syntax: '<color>'; inherits: true; initial-value: #22d3ee; }
@property --atw-cyan { syntax: '<color>'; inherits: true; initial-value: #22d3ee; }
@property --atw-pink { syntax: '<color>'; inherits: true; initial-value: #a855f7; }
@property --atw-glow { syntax: '<color>'; inherits: true; initial-value: #22d3ee; }
@property --atw-pulse { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --atw-pulse-mix { syntax: '<number>'; inherits: true; initial-value: 0; }
[data-aurora-orb-tw] {
  --atw-sky-hi: #16223c;
  --atw-sky-top: #0d1526;
  --atw-sky-mid: #0a111f;
  --atw-sky-low: #04070e;
  --atw-hi: color-mix(in oklab, var(--orb-color-from), #ecfdf5 62%);
  --atw-green: color-mix(in oklab, var(--orb-color-from), #34d399 55%);
  --atw-cyan: color-mix(in oklab, var(--orb-color-from), var(--orb-color-to) 38%);
  --atw-pink: color-mix(in oklab, var(--orb-color-to), #f472b6 42%);
  --atw-glow: color-mix(in oklab, var(--atw-green), var(--atw-cyan) 40%);
  --atw-pulse-mix: 0;
  box-shadow:
    0 22px 44px -20px rgb(8 12 26 / 0.5),
    0 6px 18px -8px rgb(10 16 32 / 0.32);
  transform: scale(calc(1 + 0.035 * var(--orb-bass, 0)));
  transition:
    --atw-sky-hi 0.4s ease,
    --atw-sky-top 0.4s ease,
    --atw-sky-mid 0.4s ease,
    --atw-sky-low 0.4s ease,
    --atw-hi 0.4s ease,
    --atw-green 0.4s ease,
    --atw-cyan 0.4s ease,
    --atw-pink 0.4s ease,
    --atw-glow 0.4s ease,
    --atw-pulse-mix 0.45s ease,
    filter 0.3s ease,
    opacity 0.3s ease;
}
[data-aurora-orb-tw][data-state='connecting'] { --atw-pulse-mix: 1; }
[data-aurora-orb-tw][data-state='thinking'] {
  --atw-green: color-mix(in oklab, var(--orb-color-to), var(--orb-color-from) 32%);
  --atw-pink: color-mix(in oklab, var(--orb-color-to), #f472b6 45%);
  --atw-glow: color-mix(in oklab, var(--orb-color-to), var(--orb-color-from) 25%);
}
[data-aurora-orb-tw][data-state='error'] {
  --atw-sky-hi: #2b1322;
  --atw-sky-top: #1d0e1a;
  --atw-sky-mid: #150913;
  --atw-sky-low: #08040a;
  --atw-hi: color-mix(in oklab, ${ERROR_COLOR_FROM}, white 72%);
  --atw-green: ${ERROR_COLOR_FROM};
  --atw-cyan: ${ERROR_COLOR_TO};
  --atw-pink: color-mix(in oklab, ${ERROR_COLOR_FROM}, white 38%);
  --atw-glow: ${ERROR_COLOR_TO};
}
[data-aurora-orb-tw][data-state='disabled'] { filter: grayscale(0.85); opacity: 0.55; }
[data-aurora-orb-tw][data-state='disabled'] :is([data-stars], [data-veil], [data-drift]) {
  animation-play-state: paused;
}
[data-aurora-orb-tw] [data-halo] {
  background: radial-gradient(closest-side, transparent 58%, var(--atw-glow) 71%, transparent 92%);
  opacity: calc(0.16 + 0.22 * var(--orb-level, 0) + 0.16 * var(--orb-bass, 0));
  transform: scale(calc(1 + 0.02 * var(--orb-level, 0) + 0.05 * var(--orb-bass, 0)));
}
[data-aurora-orb-tw] [data-sky] {
  background-image:
    radial-gradient(1px 1px at 21px 84px, rgb(190 214 248 / 0.5) 40%, transparent 100%),
    radial-gradient(0.8px 0.8px at 111px 31px, rgb(214 232 255 / 0.42) 40%, transparent 100%),
    radial-gradient(1.2px 1.2px at 67px 119px, rgb(226 238 255 / 0.36) 40%, transparent 100%),
    radial-gradient(125% 90% at 50% -12%, var(--atw-sky-hi) 0%, var(--atw-sky-top) 46%, transparent 74%),
    linear-gradient(to bottom, var(--atw-sky-top) 0%, var(--atw-sky-mid) 56%, var(--atw-sky-low) 100%);
  background-size:
    127px 127px,
    149px 149px,
    173px 173px,
    100% 100%,
    100% 100%;
}
[data-aurora-orb-tw] [data-stars] {
  background-image:
    radial-gradient(1.3px 1.3px at 13px 21px, rgb(237 246 255 / 0.95) 40%, transparent 100%),
    radial-gradient(0.9px 0.9px at 61px 49px, rgb(201 221 248 / 0.85) 40%, transparent 100%),
    radial-gradient(1.6px 1.6px at 37px 83px, rgb(255 255 255 / 0.92) 40%, transparent 100%),
    radial-gradient(1px 1px at 92px 11px, rgb(208 228 255 / 0.75) 40%, transparent 100%),
    radial-gradient(1.2px 1.2px at 108px 68px, rgb(228 240 255 / 0.85) 40%, transparent 100%);
  background-size:
    83px 83px,
    97px 97px,
    118px 118px,
    139px 139px,
    151px 151px;
  animation: aurora-orb-tw-twinkle calc(7.3s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-aurora-orb-tw] [data-veil] {
  transform-origin: 50% 12%;
  mix-blend-mode: screen;
  mix-blend-mode: plus-lighter;
}
[data-aurora-orb-tw] [data-veil='back'] {
  filter: blur(20px);
  opacity: calc(0.4 + 0.16 * var(--orb-level, 0) + 0.16 * var(--orb-bass, 0));
  -webkit-mask-image: linear-gradient(to bottom, black 26%, transparent 82%);
  mask-image: linear-gradient(to bottom, black 26%, transparent 82%);
  animation: aurora-orb-tw-sway-a calc(17.9s / var(--orb-speed, 1)) ease-in-out -7.3s infinite;
}
[data-aurora-orb-tw] [data-drift='back'] {
  left: 0;
  right: -210px;
  background: repeating-linear-gradient(
    90deg,
    var(--atw-green) 0px,
    transparent 64px,
    var(--atw-cyan) 118px,
    transparent 162px,
    var(--atw-green) 210px
  );
  animation: aurora-orb-tw-drift-back calc(37s / var(--orb-speed, 1)) linear infinite;
}
[data-aurora-orb-tw] [data-veil='mid'] {
  filter: blur(14px);
  opacity: calc(0.5 + 0.16 * var(--orb-level, 0) + 0.18 * var(--orb-treble, 0));
  -webkit-mask-image: linear-gradient(to bottom, black 18%, transparent 76%);
  mask-image: linear-gradient(to bottom, black 18%, transparent 76%);
  animation: aurora-orb-tw-sway-b calc(13.3s / var(--orb-speed, 1)) ease-in-out -4.1s infinite;
}
[data-aurora-orb-tw] [data-drift='mid'] {
  left: -130px;
  right: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    var(--atw-green) 16px,
    var(--atw-hi) 24px,
    var(--atw-green) 31px,
    transparent 52px,
    transparent 70px,
    var(--atw-pink) 86px,
    transparent 101px,
    var(--atw-cyan) 114px,
    transparent 130px
  );
  animation: aurora-orb-tw-drift-mid calc(19.1s / var(--orb-speed, 1)) linear infinite;
}
[data-aurora-orb-tw] [data-veil='front'] {
  filter: blur(8px);
  opacity: calc(
    (0.08 + 0.46 * var(--orb-level, 0) + 0.46 * var(--orb-treble, 0)) * (1 - var(--atw-pulse-mix)) +
      (0.06 + 0.44 * var(--atw-pulse)) * var(--atw-pulse-mix)
  );
  -webkit-mask-image: linear-gradient(to bottom, black 10%, black 34%, transparent 66%);
  mask-image: linear-gradient(to bottom, black 10%, black 34%, transparent 66%);
  animation:
    aurora-orb-tw-sway-c calc(9.7s / var(--orb-speed, 1)) ease-in-out -2.9s infinite,
    aurora-orb-tw-pulse calc(2.3s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-aurora-orb-tw] [data-drift='front'] {
  left: 0;
  right: -84px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 13px,
    var(--atw-hi) 19px,
    var(--atw-green) 25px,
    transparent 34px,
    transparent 46px,
    var(--atw-cyan) 52px,
    transparent 59px,
    transparent 67px,
    var(--atw-pink) 72px,
    transparent 84px
  );
  animation: aurora-orb-tw-drift-front calc(11.3s / var(--orb-speed, 1)) linear infinite;
}
[data-aurora-orb-tw] [data-film] {
  background-image:
    linear-gradient(to top, rgb(3 6 13 / 0.8) 0%, rgb(4 8 16 / 0.3) 10%, transparent 30%),
    radial-gradient(closest-side, transparent 70%, rgb(3 7 15 / 0.42) 94%, rgb(2 5 12 / 0.7) 100%),
    ${GRAIN};
  box-shadow: inset 0 0 0 1px rgb(154 196 235 / 0.07);
}
@keyframes aurora-orb-tw-twinkle {
  0%, 100% { opacity: 0.95; }
  23% { opacity: 0.62; }
  47% { opacity: 0.88; }
  71% { opacity: 0.55; }
}
@keyframes aurora-orb-tw-drift-back {
  to { transform: translate3d(-210px, 0, 0); }
}
@keyframes aurora-orb-tw-drift-mid {
  to { transform: translate3d(130px, 0, 0); }
}
@keyframes aurora-orb-tw-drift-front {
  to { transform: translate3d(-84px, 0, 0); }
}
@keyframes aurora-orb-tw-sway-a {
  0%, 100% { transform: translate3d(-1.6%, -0.4%, 0) skewX(-6deg) rotate(-2deg) scaleY(1.03); }
  23% { transform: translate3d(1.2%, 0.7%, 0) skewX(-7.5deg) rotate(1.2deg) scaleY(0.98); }
  47% { transform: translate3d(2.6%, -0.8%, 0) skewX(-5deg) rotate(2.6deg) scaleY(1.07); }
  71% { transform: translate3d(-2.4%, 0.9%, 0) skewX(-8deg) rotate(-1.4deg) scaleY(0.96); }
}
@keyframes aurora-orb-tw-sway-b {
  0%, 100% { transform: translate3d(1.8%, 0.5%, 0) skewX(-8deg) rotate(2.2deg) scaleY(1); }
  23% { transform: translate3d(-1.4%, -0.7%, 0) skewX(-9.5deg) rotate(-1.6deg) scaleY(1.06); }
  47% { transform: translate3d(-2.8%, 0.6%, 0) skewX(-7deg) rotate(-3deg) scaleY(0.95); }
  71% { transform: translate3d(2.2%, -0.5%, 0) skewX(-10deg) rotate(1.1deg) scaleY(1.04); }
}
@keyframes aurora-orb-tw-sway-c {
  0%, 100% { transform: translate3d(-0.8%, 0.3%, 0) skewX(-9deg) rotate(-1.2deg) scaleY(1.02); }
  23% { transform: translate3d(1.4%, -0.4%, 0) skewX(-8deg) rotate(0.9deg) scaleY(1.08); }
  47% { transform: translate3d(2%, 0.5%, 0) skewX(-10deg) rotate(1.6deg) scaleY(0.97); }
  71% { transform: translate3d(-1.8%, -0.3%, 0) skewX(-8.5deg) rotate(-0.8deg) scaleY(1.05); }
}
@keyframes aurora-orb-tw-pulse {
  0%, 100% { --atw-pulse: 0; }
  55% { --atw-pulse: 1; }
}
@media (prefers-reduced-motion: reduce) {
  [data-aurora-orb-tw],
  [data-aurora-orb-tw] * { animation: none !important; }
  [data-aurora-orb-tw] { transform: none; }
  [data-aurora-orb-tw] [data-stars] { opacity: 0.85; }
  [data-aurora-orb-tw] [data-veil='back'] { transform: skewX(-6deg) rotate(-2.4deg) scaleY(1.04); opacity: 0.58; }
  [data-aurora-orb-tw] [data-drift='back'] { transform: translate3d(-46px, 0, 0); }
  [data-aurora-orb-tw] [data-veil='mid'] { transform: skewX(-8deg) rotate(1.8deg) scaleY(1.03); opacity: 0.6; }
  [data-aurora-orb-tw] [data-drift='mid'] { transform: translate3d(-104px, 0, 0); }
  [data-aurora-orb-tw] [data-veil='front'] { transform: skewX(-9deg) rotate(-1.2deg); opacity: 0.42; }
  [data-aurora-orb-tw] [data-drift='front'] { transform: translate3d(-22px, 0, 0); }
  [data-aurora-orb-tw] [data-halo] { opacity: 0.3; transform: none; }
  [data-aurora-orb-tw][data-state='idle'] [data-veil='front'] { opacity: 0.24; }
  [data-aurora-orb-tw][data-state='idle'] [data-halo] { opacity: 0.2; }
  [data-aurora-orb-tw][data-state='connecting'] [data-veil='back'] { opacity: 0.38; }
  [data-aurora-orb-tw][data-state='connecting'] [data-veil='mid'] { opacity: 0.32; }
  [data-aurora-orb-tw][data-state='connecting'] [data-veil='front'] { opacity: 0.14; }
  [data-aurora-orb-tw][data-state='connecting'] [data-halo] { opacity: 0.12; }
  [data-aurora-orb-tw][data-state='listening'] [data-veil='mid'] { opacity: 0.78; }
  [data-aurora-orb-tw][data-state='listening'] [data-veil='front'] { opacity: 0.6; }
  [data-aurora-orb-tw][data-state='listening'] [data-halo] { opacity: 0.46; }
  [data-aurora-orb-tw][data-state='speaking'] [data-veil='back'] { opacity: 0.72; }
  [data-aurora-orb-tw][data-state='speaking'] [data-veil='mid'] { opacity: 0.88; }
  [data-aurora-orb-tw][data-state='speaking'] [data-veil='front'] { opacity: 0.78; }
  [data-aurora-orb-tw][data-state='speaking'] [data-drift='front'] { transform: translate3d(-58px, 0, 0); }
  [data-aurora-orb-tw][data-state='speaking'] [data-halo] { opacity: 0.58; }
  [data-aurora-orb-tw][data-state='thinking'] [data-veil='mid'] { opacity: 0.7; }
  [data-aurora-orb-tw][data-state='thinking'] [data-halo] { opacity: 0.4; }
  [data-aurora-orb-tw][data-state='error'] [data-veil='front'] { opacity: 0.55; }
  [data-aurora-orb-tw][data-state='error'] [data-halo] { opacity: 0.44; }
}
`;

export const AuroraOrbTw = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#22d3ee',
  colorTo = '#a855f7',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useOrbLevel(innerRef, state, levelRef);

  return (
    <div
      ref={setRef}
      role="img"
      aria-label={label}
      data-state={state}
      data-aurora-orb-tw=""
      className={clsx('relative rounded-full', className)}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
      }}
    >
      <style>{AURORA_TW_CSS}</style>
      <span data-halo="" className="absolute -inset-[24%] rounded-full" />
      <span data-sky="" className="absolute inset-0 isolate overflow-hidden rounded-full">
        <span data-stars="" className="absolute inset-0" />
        <span data-veil="back" className="absolute -inset-x-[24%] -inset-y-[16%] will-change-transform">
          <span data-drift="back" className="absolute inset-y-0 will-change-transform" />
        </span>
        <span data-veil="mid" className="absolute -inset-x-[24%] -inset-y-[16%] will-change-transform">
          <span data-drift="mid" className="absolute inset-y-0 will-change-transform" />
        </span>
        <span data-veil="front" className="absolute -inset-x-[24%] -inset-y-[16%] will-change-transform">
          <span data-drift="front" className="absolute inset-y-0 will-change-transform" />
        </span>
        <span data-film="" className="absolute inset-0 rounded-full" />
      </span>
    </div>
  );
};
