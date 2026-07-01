'use client';

import { useEffect, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

interface Particle {
  angle: number;
  radius: number;
  spin: number;
  size: number;
  phase: number;
  tone: number;
}

const COUNT = 46;

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

export const ParticlesOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#f0abfc',
  colorTo = '#818cf8',
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.28 + Math.random() * 0.42,
      spin: 0.3 + Math.random() * 0.9,
      size: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      tone: Math.random(),
    }));

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.46;
    let raf = 0;
    let start: number | null = null;

    const render = (t: number) => {
      const level = Number.parseFloat(
        getComputedStyle(host).getPropertyValue('--orb-level'),
      ) || 0;
      const isError = stateRef.current === 'error';
      const from = hexToRgb(isError ? '#fb7185' : colorRef.current.from);
      const to = hexToRgb(isError ? '#f43f5e' : colorRef.current.to);
      const swirl =
        stateRef.current === 'connecting' || stateRef.current === 'thinking' ? 1.8 : 1;

      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'lighter';

      const coreR = size * (0.08 + 0.05 * level);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.4);
      grad.addColorStop(0, `rgba(${from[0]}, ${from[1]}, ${from[2]}, ${0.5 + 0.4 * level})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      for (const p of particles) {
        const a = p.angle + t * p.spin * speedRef.current * swirl * 0.6;
        const breathe = Math.sin(t * 2 * speedRef.current + p.phase);
        const r = maxR * p.radius * (0.7 + 0.4 * level + 0.12 * breathe);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const [cr, cg, cb] = [
          from[0] + (to[0] - from[0]) * p.tone,
          from[1] + (to[1] - from[1]) * p.tone,
          from[2] + (to[2] - from[2]) * p.tone,
        ];
        const alpha = Math.min(1, 0.25 + 0.6 * level + 0.2 * (breathe + 1));
        ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + 0.6 * level), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
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
  }, [size]);

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
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};
