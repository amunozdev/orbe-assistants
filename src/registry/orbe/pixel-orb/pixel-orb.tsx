'use client';

import { useEffect, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

const GRID = 22;

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const PixelOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#34d399',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorRef = useRef({ from: colorFrom, to: colorTo });

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorRef.current = { from: colorFrom, to: colorTo };
  });

  useOrbLevel(ref, state, levelRef);

  useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let start: number | null = null;

    const render = (elapsed: number) => {
      const level = Number.parseFloat(
        getComputedStyle(host).getPropertyValue('--orb-level'),
      ) || 0;
      const isError = stateRef.current === 'error';
      const from = hexToRgb(isError ? '#fb7185' : colorRef.current.from);
      const to = hexToRgb(isError ? '#f43f5e' : colorRef.current.to);
      const wobble =
        stateRef.current === 'connecting' || stateRef.current === 'thinking' ? 0.35 : 0;

      ctx.clearRect(0, 0, GRID, GRID);
      const c = (GRID - 1) / 2;
      const baseR = GRID * 0.32;
      const radius = baseR * (1 + 0.28 * level);

      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const dx = x - c;
          const dy = y - c;
          const dist = Math.hypot(dx, dy);
          if (dist > radius) continue;
          const ang = Math.atan2(dy, dx);
          const ripple =
            0.5 +
            0.5 *
              Math.sin(dist * 0.9 - elapsed * 3.2 * speedRef.current + ang * wobble * 4);
          const edge = 1 - dist / radius;
          const bright = Math.min(1, 0.25 + edge * 0.6 + ripple * (0.35 + level));
          const [r, g, b] = mix(from, to, Math.min(1, dist / radius + ripple * 0.2));
          ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${bright.toFixed(3)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    if (reduce) {
      render(0);
      return;
    }

    const frame = (now: number) => {
      if (start === null) start = now;
      render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        width={GRID}
        height={GRID}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          borderRadius: '14%',
        }}
      />
    </div>
  );
};
