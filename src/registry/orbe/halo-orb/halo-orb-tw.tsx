'use client';

import { useCallback, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const HALO_TW_CSS = `
@property --htw-rot-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --htw-rot-b { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --htw-rot-c { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --htw-rot-d { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --htw-from { syntax: '<color>'; inherits: true; initial-value: #818cf8; }
@property --htw-to { syntax: '<color>'; inherits: true; initial-value: #f472b6; }
@property --htw-breathe { syntax: '<number>'; inherits: false; initial-value: 0; }
@property --htw-breathe-amp { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --htw-spark-lo { syntax: '<number>'; inherits: true; initial-value: 0.25; }
@property --htw-spark-hi { syntax: '<number>'; inherits: true; initial-value: 0.75; }
[data-halo-orb-tw] {
  --htw-from: var(--orb-color-from);
  --htw-to: var(--orb-color-to);
  --htw-breathe-amp: 0;
  --htw-spark-lo: 0.25;
  --htw-spark-hi: 0.75;
  perspective: calc(var(--orb-size) * 4.5);
  transform-style: preserve-3d;
  transition:
    --htw-from 0.45s ease,
    --htw-to 0.45s ease,
    --htw-breathe-amp 0.6s ease,
    --htw-spark-lo 0.4s ease,
    --htw-spark-hi 0.4s ease,
    filter 0.45s ease,
    opacity 0.45s ease;
}
[data-halo-orb-tw] [data-edge] {
  border: 1px solid color-mix(in oklab, var(--htw-from), black 18%);
}
[data-halo-orb-tw] [data-glow] {
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--htw-to), transparent 12%) 0%,
    color-mix(in oklab, var(--htw-from), transparent 40%) 46%,
    transparent 74%
  );
  opacity: calc(0.35 + 0.55 * var(--orb-level, 0));
  transform: scale(calc(0.9 + 0.28 * var(--orb-level, 0)));
}
[data-halo-orb-tw] [data-halo] {
  -webkit-mask: radial-gradient(farthest-side, transparent 56%, #000 66%, #000 80%, transparent 98%);
  mask: radial-gradient(farthest-side, transparent 56%, #000 66%, #000 80%, transparent 98%);
  transform: rotate(calc(var(--htw-rot-a) + var(--htw-rot-b) + var(--htw-rot-c) + var(--htw-rot-d)));
}
[data-halo-orb-tw] [data-halo='a'] {
  background:
    repeating-conic-gradient(rgb(255 255 255 / 0.03) 0deg 1.5deg, rgb(255 255 255 / 0) 1.5deg 3deg),
    conic-gradient(
      from 210deg in oklch,
      var(--htw-from) 0deg,
      color-mix(in oklch, var(--htw-from), white 30%) 52deg,
      var(--htw-to) 138deg,
      color-mix(in oklch, var(--htw-to), white 30%) 224deg,
      color-mix(in oklch, var(--htw-from), var(--htw-to) 45%) 292deg,
      var(--htw-from) 360deg
    );
  opacity: calc(0.85 + 0.15 * var(--orb-level, 0));
  animation:
    htw-rot-a calc(6.5s / var(--orb-speed, 1)) linear infinite,
    htw-rot-b calc(6.303s / var(--orb-speed, 1)) linear infinite,
    htw-rot-c calc(15.889s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-d calc(26s / var(--orb-speed, 1)) linear infinite;
  animation-play-state: running, paused, paused, paused;
}
[data-halo-orb-tw] [data-halo='b'] {
  background: conic-gradient(
    from 30deg in oklch,
    transparent 0deg,
    color-mix(in oklch, var(--htw-to), white 35%) 42deg,
    transparent 96deg,
    transparent 178deg,
    color-mix(in oklch, var(--htw-from), white 35%) 236deg,
    transparent 300deg
  );
  opacity: calc(0.45 + 0.55 * var(--orb-level, 0));
  animation:
    htw-rot-a calc(9s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-b calc(2.739s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-c calc(25.2s / var(--orb-speed, 1)) linear infinite,
    htw-rot-d calc(7.2s / var(--orb-speed, 1)) linear infinite reverse;
  animation-play-state: running, paused, paused, paused;
}
[data-halo-orb-tw] [data-disc] {
  background: radial-gradient(
    circle at 50% 44%,
    color-mix(in oklab, var(--htw-to), transparent 30%) 0%,
    color-mix(in oklab, var(--htw-from), transparent 62%) 36%,
    color-mix(in oklab, var(--htw-from), transparent 88%) 62%,
    transparent 78%
  );
  opacity: calc(0.7 + 0.3 * var(--orb-level, 0));
  transform: scale(calc(1 + 0.08 * var(--orb-level, 0) + 0.045 * var(--htw-breathe) * var(--htw-breathe-amp)));
  animation: htw-breathe calc(5.2s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-halo-orb-tw] [data-core] {
  background:
    radial-gradient(circle at 33% 26%, rgb(255 255 255 / 0.95) 0%, rgb(255 255 255 / 0) 26%),
    radial-gradient(circle at 50% 116%, color-mix(in oklch, var(--htw-to), white 32%) 0%, transparent 46%),
    radial-gradient(
      circle at 44% 38%,
      color-mix(in oklch, var(--htw-from), white 24%) 0%,
      var(--htw-from) 42%,
      var(--htw-to) 78%,
      color-mix(in oklab, var(--htw-to), black 28%) 100%
    );
  box-shadow:
    inset 0 calc(var(--orb-size) * -0.015) calc(var(--orb-size) * 0.035) color-mix(in oklch, var(--htw-to), white 35%),
    inset 0 calc(var(--orb-size) * 0.012) calc(var(--orb-size) * 0.028) color-mix(in oklab, var(--htw-from), black 38%),
    0 0 calc(var(--orb-size) * 0.055) color-mix(in oklab, var(--htw-to), transparent 35%),
    0 0 calc(var(--orb-size) * 0.16) calc(var(--orb-size) * 0.02) color-mix(in oklab, var(--htw-from), transparent 55%);
  transform: scale(calc(1 + 0.1 * var(--orb-level, 0) + 0.045 * var(--htw-breathe) * var(--htw-breathe-amp)));
  animation: htw-breathe calc(5.2s / var(--orb-speed, 1)) ease-in-out infinite;
}
[data-halo-orb-tw] [data-orbit] {
  opacity: 0.7;
  transition: opacity 0.4s ease;
}
[data-halo-orb-tw] [data-orbit='a'] {
  transform: rotateZ(18deg) rotateX(64deg);
}
[data-halo-orb-tw] [data-orbit='b'] {
  transform: rotateZ(-18deg) rotateX(64deg);
}
[data-halo-orb-tw] [data-track] {
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2px), #000 calc(100% - 1px), transparent 100%);
  mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #000 calc(100% - 2px), #000 calc(100% - 1px), transparent 100%);
  transform: rotate(calc(var(--htw-rot-a) + var(--htw-rot-b) + var(--htw-rot-c) + var(--htw-rot-d)));
}
[data-halo-orb-tw] [data-track='a'] {
  background:
    radial-gradient(circle 4px at 50% 2px, color-mix(in oklch, var(--htw-to), white 45%) 0%, color-mix(in oklab, var(--htw-to), transparent 25%) 55%, transparent 100%),
    conic-gradient(
      from 0deg,
      transparent 0deg 60deg,
      color-mix(in oklab, var(--htw-to), transparent 82%) 150deg,
      color-mix(in oklab, var(--htw-to), transparent 30%) 300deg,
      color-mix(in oklch, var(--htw-to), white 30%) 356deg,
      transparent 360deg
    );
  animation:
    htw-rot-a calc(4.4s / var(--orb-speed, 1)) linear infinite,
    htw-rot-b calc(10.492s / var(--orb-speed, 1)) linear infinite,
    htw-rot-c calc(4.4s / var(--orb-speed, 1)) linear infinite,
    htw-rot-d calc(14.96s / var(--orb-speed, 1)) linear infinite;
  animation-play-state: running, paused, paused, paused;
}
[data-halo-orb-tw] [data-track='b'] {
  background:
    radial-gradient(circle 4px at 50% 2px, color-mix(in oklch, var(--htw-from), white 45%) 0%, color-mix(in oklab, var(--htw-from), transparent 25%) 55%, transparent 100%),
    conic-gradient(
      from 0deg,
      color-mix(in oklch, var(--htw-from), white 30%) 4deg,
      color-mix(in oklab, var(--htw-from), transparent 30%) 60deg,
      color-mix(in oklab, var(--htw-from), transparent 82%) 210deg,
      transparent 300deg
    );
  animation:
    htw-rot-a calc(6.2s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-b calc(13.02s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-c calc(5.8125s / var(--orb-speed, 1)) linear infinite reverse,
    htw-rot-d calc(21.257s / var(--orb-speed, 1)) linear infinite reverse;
  animation-play-state: running, paused, paused, paused;
}
[data-halo-orb-tw] [data-sparks] {
  background: color-mix(in oklch, var(--htw-to), white 45%);
  box-shadow:
    0 0 6px 1px color-mix(in oklab, var(--htw-to), transparent 25%),
    calc(var(--orb-size) * 0.253) calc(var(--orb-size) * 0.572) 0 -0.5px color-mix(in oklch, var(--htw-from), white 30%),
    calc(var(--orb-size) * 0.253) calc(var(--orb-size) * 0.572) 5px 0.5px color-mix(in oklab, var(--htw-from), transparent 40%),
    calc(var(--orb-size) * -0.363) calc(var(--orb-size) * 0.529) 0 -1px color-mix(in oklch, var(--htw-to), white 25%),
    calc(var(--orb-size) * -0.363) calc(var(--orb-size) * 0.529) 4px 0 color-mix(in oklab, var(--htw-to), transparent 45%);
  opacity: calc(var(--htw-spark-lo) + var(--htw-spark-hi) * var(--orb-level, 0));
  transform: rotate(calc(35deg + var(--htw-rot-a) + var(--htw-rot-b) + var(--htw-rot-c))) translateY(calc(var(--orb-size) * -0.36));
  animation:
    htw-rot-a calc(7.5s / var(--orb-speed, 1)) linear infinite,
    htw-rot-b calc(9.545s / var(--orb-speed, 1)) linear infinite,
    htw-rot-c calc(6.923s / var(--orb-speed, 1)) linear infinite;
  animation-play-state: running, paused, paused;
}
[data-halo-orb-tw][data-state='idle'] {
  --htw-breathe-amp: 1;
}
[data-halo-orb-tw][data-state='connecting'] [data-halo],
[data-halo-orb-tw][data-state='connecting'] [data-track],
[data-halo-orb-tw][data-state='connecting'] [data-sparks] {
  animation-play-state: running, running, paused, paused;
}
[data-halo-orb-tw][data-state='listening'] [data-track] {
  animation-play-state: running, paused, paused, running;
}
[data-halo-orb-tw][data-state='thinking'] {
  --htw-spark-lo: 0.6;
  --htw-spark-hi: 0.4;
}
[data-halo-orb-tw][data-state='thinking'] [data-halo],
[data-halo-orb-tw][data-state='thinking'] [data-track],
[data-halo-orb-tw][data-state='thinking'] [data-sparks] {
  animation-play-state: running, paused, running, paused;
}
[data-halo-orb-tw][data-state='speaking'] [data-halo='a'] {
  animation-play-state: running, paused, paused, running;
}
[data-halo-orb-tw][data-state='connecting'] [data-orbit],
[data-halo-orb-tw][data-state='thinking'] [data-orbit] {
  opacity: 1;
}
[data-halo-orb-tw][data-state='error'] {
  --htw-from: #fb7185;
  --htw-to: #f43f5e;
}
[data-halo-orb-tw][data-state='error'] [data-core] {
  animation:
    htw-breathe calc(5.2s / var(--orb-speed, 1)) ease-in-out infinite,
    htw-flicker calc(0.9s / var(--orb-speed, 1)) steps(2, jump-none) infinite;
}
[data-halo-orb-tw][data-state='error'] [data-halo='b'] {
  animation-play-state: running, paused, paused, running;
}
[data-halo-orb-tw][data-state='disabled'] {
  filter: grayscale(0.85);
  opacity: 0.5;
}
[data-halo-orb-tw][data-state='disabled'] [data-halo],
[data-halo-orb-tw][data-state='disabled'] [data-disc],
[data-halo-orb-tw][data-state='disabled'] [data-core],
[data-halo-orb-tw][data-state='disabled'] [data-sparks],
[data-halo-orb-tw][data-state='disabled'] [data-track] {
  animation-play-state: paused;
}
@keyframes htw-rot-a {
  to { --htw-rot-a: 360deg; }
}
@keyframes htw-rot-b {
  to { --htw-rot-b: 360deg; }
}
@keyframes htw-rot-c {
  to { --htw-rot-c: 360deg; }
}
@keyframes htw-rot-d {
  to { --htw-rot-d: 360deg; }
}
@keyframes htw-breathe {
  0%, 100% { --htw-breathe: 0; }
  50% { --htw-breathe: 1; }
}
@keyframes htw-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
@media (prefers-reduced-motion: reduce) {
  [data-halo-orb-tw][data-state] [data-glow],
  [data-halo-orb-tw][data-state] [data-halo],
  [data-halo-orb-tw][data-state] [data-disc],
  [data-halo-orb-tw][data-state] [data-core],
  [data-halo-orb-tw][data-state] [data-sparks],
  [data-halo-orb-tw][data-state] [data-track] {
    animation: none;
  }
  [data-halo-orb-tw][data-state] [data-halo='b'] {
    transform: rotate(140deg);
  }
  [data-halo-orb-tw][data-state] [data-track='a'] {
    transform: rotate(230deg);
  }
  [data-halo-orb-tw][data-state] [data-track='b'] {
    transform: rotate(40deg);
  }
  [data-halo-orb-tw][data-state] [data-glow] {
    opacity: 0.5;
    transform: scale(1);
  }
  [data-halo-orb-tw][data-state] [data-sparks] {
    opacity: 0.55;
  }
  [data-halo-orb-tw][data-state='idle'] [data-glow] {
    opacity: 0.38;
    transform: scale(0.94);
  }
  [data-halo-orb-tw][data-state='connecting'] [data-glow] {
    opacity: 0.3;
    transform: scale(0.9);
  }
  [data-halo-orb-tw][data-state='connecting'] [data-halo='a'] {
    opacity: 0.55;
  }
  [data-halo-orb-tw][data-state='connecting'] [data-sparks] {
    opacity: 0.35;
  }
  [data-halo-orb-tw][data-state='listening'] [data-glow] {
    opacity: 0.75;
    transform: scale(1.06);
  }
  [data-halo-orb-tw][data-state='listening'] [data-halo='b'] {
    opacity: 0.85;
    transform: rotate(40deg);
  }
  [data-halo-orb-tw][data-state='listening'] [data-sparks] {
    opacity: 0.85;
  }
  [data-halo-orb-tw][data-state='thinking'] [data-glow] {
    opacity: 0.55;
  }
  [data-halo-orb-tw][data-state='thinking'] [data-track='a'] {
    transform: rotate(120deg);
  }
  [data-halo-orb-tw][data-state='thinking'] [data-track='b'] {
    transform: rotate(320deg);
  }
  [data-halo-orb-tw][data-state='speaking'] [data-glow] {
    opacity: 0.9;
    transform: scale(1.12);
  }
  [data-halo-orb-tw][data-state='speaking'] [data-halo='a'] {
    transform: rotate(100deg);
  }
  [data-halo-orb-tw][data-state='speaking'] [data-halo='b'] {
    transform: rotate(250deg);
  }
  [data-halo-orb-tw][data-state='speaking'] [data-sparks] {
    opacity: 1;
  }
  [data-halo-orb-tw][data-state='error'] [data-glow] {
    opacity: 0.6;
  }
}
`;

export const HaloOrbTw = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#f472b6',
  levelRef,
  label = 'Assistant orb',
  className,
  ref: refProp,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof refProp === 'function') {
        refProp(node);
      } else if (refProp) {
        refProp.current = node;
      }
    },
    [refProp],
  );

  useOrbLevel(innerRef, state, levelRef);

  return (
    <div
      ref={setRef}
      role="img"
      aria-label={label}
      data-state={state}
      data-halo-orb-tw=""
      className={['relative grid place-items-center', className].filter(Boolean).join(' ')}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
      }}
    >
      <style>{HALO_TW_CSS}</style>
      <span data-glow="" className="absolute h-[92%] w-[92%] rounded-full blur-[18px] will-change-[transform,opacity]" />
      <span data-halo="b" className="absolute inset-[2%] rounded-full will-change-transform" />
      <span data-halo="a" className="absolute inset-[2%] rounded-full will-change-transform" />
      <span data-disc="" className="absolute h-[58%] w-[58%] rounded-full" />
      <span data-core="" className="absolute h-[30%] w-[30%] rounded-full" />
      <span data-orbit="a" className="absolute h-[60%] w-[60%] rounded-full">
        <span data-track="a" className="absolute inset-0 rounded-full will-change-transform" />
      </span>
      <span data-orbit="b" className="absolute h-full w-full rounded-full">
        <span data-track="b" className="absolute inset-0 rounded-full will-change-transform" />
      </span>
      <span data-sparks="" className="absolute h-[3px] w-[3px] rounded-full will-change-transform" />
      <span data-edge="" className="absolute inset-[3%] rounded-full opacity-40" />
    </div>
  );
};
