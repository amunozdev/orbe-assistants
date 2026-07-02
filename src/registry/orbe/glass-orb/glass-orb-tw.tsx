'use client';

import { useRef } from 'react';
import clsx from 'clsx';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const GLASS_ORB_TW_CSS = `
[data-glass-orb]{--glass-blend:color-mix(in oklab, var(--orb-color-from), var(--orb-color-to) 50%);--glass-fill:light-dark(color-mix(in oklab, var(--glass-blend), transparent 62%), color-mix(in oklab, var(--glass-blend), transparent 86%));--glass-edge:light-dark(color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #171a2b 55%), transparent 35%), color-mix(in oklab, #ffffff, transparent 66%));--glass-depth:light-dark(color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #10131f 42%), transparent 46%), color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #05060c 52%), transparent 36%));--glass-contact:light-dark(color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #10131f 55%), transparent 50%), color-mix(in oklab, color-mix(in oklab, var(--glass-blend), #000000 40%), transparent 42%));--glass-halo-tight:light-dark(color-mix(in oklab, var(--glass-blend), transparent 32%), transparent);--glass-halo-wide:light-dark(transparent, color-mix(in oklab, var(--glass-blend), transparent 42%));--glass-caustic:color-mix(in oklab, color-mix(in oklab, var(--orb-color-to), #ffffff 55%), transparent 28%);--glass-spec-counter:color-mix(in oklab, color-mix(in oklab, var(--orb-color-to), #ffffff 42%), transparent 70%)}
@keyframes glass-orb-tw-rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes glass-orb-tw-hue{from{filter:blur(14px) hue-rotate(-8deg)}to{filter:blur(14px) hue-rotate(8deg)}}
@keyframes glass-orb-tw-shimmer{from{opacity:0.72;transform:translate3d(-0.6%, 0.4%, 0)}to{opacity:1;transform:translate3d(0.6%, -0.4%, 0)}}
@keyframes glass-orb-tw-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes glass-orb-tw-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
[data-glass-orb] [data-part=halo]{opacity:calc(0.72 + 0.28 * var(--orb-level, 0));transform:scale(calc(1 + 0.14 * var(--orb-level, 0)))}
[data-glass-orb] [data-part=aura]{opacity:calc(0.62 + 0.38 * var(--orb-level, 0));animation:glass-orb-tw-rotate calc(9s / var(--orb-speed, 1)) linear infinite, glass-orb-tw-hue calc(16s / var(--orb-speed, 1)) ease-in-out infinite alternate}
[data-glass-orb] [data-part=sphere]{transform:scale(calc(1 + 0.045 * var(--orb-level, 0)))}
[data-glass-orb] [data-part=sheen]{animation:glass-orb-tw-rotate calc(14s / var(--orb-speed, 1)) linear infinite}
[data-glass-orb] [data-part=rim]{opacity:0.85}
[data-glass-orb] [data-part=spec]{animation:glass-orb-tw-shimmer calc(7s / var(--orb-speed, 1)) ease-in-out infinite alternate}
[data-glass-orb] [data-part=counter]{opacity:0;transition:opacity 0.35s ease;animation:glass-orb-tw-rotate calc(2.6s / var(--orb-speed, 1)) linear infinite reverse;animation-play-state:paused}
[data-glass-orb][data-state=connecting] [data-part=counter]{opacity:0.55;animation-play-state:running;animation-duration:calc(4.5s / var(--orb-speed, 1))}
[data-glass-orb][data-state=connecting] [data-part=sphere]{animation:glass-orb-tw-breathe calc(3.2s / var(--orb-speed, 1)) ease-in-out infinite}
[data-glass-orb][data-state=thinking] [data-part=counter]{opacity:1;animation-play-state:running}
[data-glass-orb][data-state=listening] [data-part=halo]{opacity:calc(0.6 + 0.4 * var(--orb-level, 0));transform:scale(calc(1 + 0.2 * var(--orb-level, 0)))}
[data-glass-orb][data-state=speaking] [data-part=rim]{opacity:calc(0.7 + 0.45 * var(--orb-level, 0))}
[data-glass-orb][data-state=error]{--orb-color-from:#fb7185;--orb-color-to:#f43f5e;animation:glass-orb-tw-shake 0.32s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1}
[data-glass-orb][data-state=error] [data-part=aura],[data-glass-orb][data-state=error] [data-part=sheen]{animation-play-state:paused}
[data-glass-orb][data-state=disabled]{filter:grayscale(0.85);opacity:0.5}
[data-glass-orb][data-state=disabled] [data-part=aura],[data-glass-orb][data-state=disabled] [data-part=sheen],[data-glass-orb][data-state=disabled] [data-part=spec],[data-glass-orb][data-state=disabled] [data-part=counter]{animation-play-state:paused}
@media (prefers-reduced-motion: reduce){[data-glass-orb],[data-glass-orb] [data-part=aura],[data-glass-orb] [data-part=sphere],[data-glass-orb] [data-part=sheen],[data-glass-orb] [data-part=spec],[data-glass-orb] [data-part=counter]{animation:none}}
@supports not (color: light-dark(#000, #fff)){[data-glass-orb]{--glass-fill:color-mix(in oklab, var(--glass-blend), transparent 86%);--glass-edge:color-mix(in oklab, #ffffff, transparent 66%);--glass-depth:color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #05060c 52%), transparent 36%);--glass-contact:color-mix(in oklab, color-mix(in oklab, var(--glass-blend), #000000 40%), transparent 42%);--glass-halo-tight:transparent;--glass-halo-wide:color-mix(in oklab, var(--glass-blend), transparent 42%)}
@media (prefers-color-scheme: light){[data-glass-orb]{--glass-fill:color-mix(in oklab, var(--glass-blend), transparent 62%);--glass-edge:color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #171a2b 55%), transparent 35%);--glass-depth:color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #10131f 42%), transparent 46%);--glass-contact:color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #10131f 55%), transparent 50%);--glass-halo-tight:color-mix(in oklab, var(--glass-blend), transparent 32%);--glass-halo-wide:transparent}}}
@supports not ((backdrop-filter: blur(4px)) or (-webkit-backdrop-filter: blur(4px))){[data-glass-orb]{--glass-fill:light-dark(color-mix(in oklab, var(--glass-blend), transparent 40%), color-mix(in oklab, var(--glass-blend), transparent 64%))}}
`;

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

const RING_MASK = (edge: string, inner: string, outer: string) =>
  `radial-gradient(closest-side, transparent calc(100% - ${edge}), #000 calc(100% - ${inner}), #000 calc(100% - ${outer}), transparent)`;

export const GlassOrbTw = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#a78bfa',
  colorTo = '#38bdf8',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const rimMask = RING_MASK('7px', '5px', '1.5px');
  const counterMask = RING_MASK('8px', '6px', '2px');

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-glass-orb=""
      data-state={state}
      className={clsx('relative isolate grid place-items-center', className)}
      style={{ ...orbVars({ size, speed, colorFrom, colorTo }), width: size, height: size }}
    >
      <style href="glass-orb-tw" precedence="medium">
        {GLASS_ORB_TW_CSS}
      </style>
      <span
        data-part="halo"
        className="absolute -inset-[8%] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, var(--glass-halo-tight) 18%, transparent 66%), radial-gradient(closest-side, var(--glass-halo-wide) 10%, transparent 96%)',
        }}
      />
      <span
        data-part="aura"
        className="absolute inset-[2.5%] rounded-full"
        style={{
          background:
            'conic-gradient(from 20deg, var(--orb-color-from), color-mix(in oklch, var(--orb-color-from), #ff3ea5 34%) 18%, var(--orb-color-to) 42%, color-mix(in oklch, var(--orb-color-to), #ffb54d 30%) 64%, color-mix(in oklch, var(--orb-color-from), #ffffff 24%) 82%, var(--orb-color-from))',
          filter: 'blur(14px)',
        }}
      />
      <span
        data-part="sphere"
        className="absolute inset-[10%] rounded-full backdrop-blur-[10px] backdrop-saturate-150 backdrop-brightness-105"
        style={{
          backgroundColor: 'var(--glass-fill)',
          backgroundImage:
            'radial-gradient(60% 30% at 50% 96%, var(--glass-caustic), transparent 70%), radial-gradient(85% 60% at 50% 112%, var(--glass-depth), transparent 74%), linear-gradient(148deg, color-mix(in oklab, var(--orb-color-from), transparent 74%), color-mix(in oklab, var(--orb-color-to), transparent 68%) 90%)',
          boxShadow:
            'inset 0 0 0 1px var(--glass-edge), inset 0 2px 10px color-mix(in oklab, #ffffff, transparent 62%), inset 0 -12px 26px var(--glass-depth), 0 16px 36px -14px var(--glass-contact)',
        }}
      />
      <span
        data-part="sheen"
        className="absolute inset-[10%] rounded-full opacity-[0.12]"
        style={{
          background:
            'conic-gradient(from 40deg, transparent 0deg 60deg, rgba(255,255,255,0.85) 102deg, transparent 148deg 236deg, color-mix(in oklab, #ffffff, transparent 55%) 268deg, transparent 306deg)',
          WebkitMask:
            'radial-gradient(closest-side, #000 52%, rgba(0,0,0,0.35) 78%, transparent 97%)',
          mask: 'radial-gradient(closest-side, #000 52%, rgba(0,0,0,0.35) 78%, transparent 97%)',
        }}
      />
      <span
        data-part="rim"
        className="absolute inset-[10%] rounded-full"
        style={{
          background:
            'conic-gradient(from -70deg, transparent 0deg, rgba(255,255,255,0.9) 42deg, color-mix(in oklab, var(--orb-color-to), #ffffff 55%) 78deg, transparent 148deg, color-mix(in oklab, color-mix(in oklab, var(--orb-color-from), #ffffff 45%), transparent 45%) 208deg, transparent 268deg)',
          WebkitMask: rimMask,
          mask: rimMask,
        }}
      />
      <span
        data-part="spec"
        className="absolute inset-[10%] rounded-full"
        style={{
          background:
            'radial-gradient(10% 7% at 31% 25%, rgba(255,255,255,0.95) 88%, transparent 92%), radial-gradient(20% 14% at 33% 28%, rgba(255,255,255,0.45), transparent 74%), radial-gradient(15% 10% at 69% 79%, var(--glass-spec-counter), transparent 78%)',
        }}
      />
      <span
        data-part="counter"
        className="absolute inset-[3%] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--orb-color-to), #ffffff 35%) 14deg, color-mix(in oklab, var(--orb-color-from), #ffffff 20%) 46deg, transparent 60deg 360deg)',
          WebkitMask: counterMask,
          mask: counterMask,
        }}
      />
      <span
        data-part="grain"
        className="absolute -inset-[8%] rounded-full mix-blend-overlay opacity-5"
        style={{
          backgroundImage: GRAIN_URI,
          backgroundSize: '120px 120px',
          WebkitMask: 'radial-gradient(closest-side, #000 55%, transparent 100%)',
          mask: 'radial-gradient(closest-side, #000 55%, transparent 100%)',
        }}
      />
    </div>
  );
};
