'use client';

import type { CSSProperties } from 'react';
import { useEffect, useId, useRef } from 'react';
import {
  approach,
  createStateMix,
  orbVars,
  stateEnergy,
  type OrbProps,
} from '../../lib/orb-state';

interface Satellite {
  r: number;
  fused: number;
  detach: number;
  lo: number;
  hi: number;
  w: number;
  phase: number;
  staticD: number;
}

const CORE_R = 28.8;

const SATELLITES: Satellite[] = [
  { r: 6.5, fused: 10, detach: 44, lo: 0.16, hi: 0.5, w: 0.55, phase: -0.6, staticD: 27 },
  { r: 5.2, fused: 12, detach: 42, lo: 0.26, hi: 0.62, w: -0.38, phase: 2.6, staticD: 30 },
  { r: 4.2, fused: 9, detach: 39, lo: 0.36, hi: 0.72, w: 0.72, phase: 1.2, staticD: 20 },
];

const STATIC_XY = SATELLITES.map((s) => ({
  x: 50 + Math.cos(s.phase) * s.staticD,
  y: 50 + Math.sin(s.phase) * s.staticD,
}));

const STATIC_POSE = STATIC_XY.map((p) => ({ cx: p.x.toFixed(2), cy: p.y.toFixed(2) }));

const ROSE_FROM = '#fb7185';
const ROSE_TO = '#f43f5e';

const HIGHLIGHT = 'color-mix(in oklab, #ffffff 74%, var(--goo-from))';
const MIDTONE = 'color-mix(in oklab, var(--goo-from) 46%, var(--goo-to))';
const DEEP = 'color-mix(in oklab, var(--goo-to) 84%, #000000)';
const SAT_FILLS = [
  'color-mix(in oklab, var(--goo-from) 55%, var(--goo-to))',
  'var(--goo-to)',
  'color-mix(in oklab, var(--goo-to) 76%, #000000)',
];
const SHADOW =
  'drop-shadow(0 7px 18px color-mix(in oklab, var(--goo-to) 26%, transparent)) drop-shadow(0 2px 7px color-mix(in oklab, var(--goo-from) 18%, transparent))';

const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

const errorPulse = (t: number) => {
  const p = (t % 1.5) / 1.5;
  const beat = (center: number) => Math.exp(-(((p - center) / 0.055) ** 2));
  return beat(0.1) + beat(0.32);
};

const mixToward = (base: string, target: string, pct: number) =>
  pct <= 0 ? base : pct >= 100 ? target : `color-mix(in oklab, ${target} ${pct}%, ${base})`;

export const GooeyOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom = '#f472b6',
  colorTo = '#8b5cf6',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const rawId = useId().replace(/:/g, '');
  const filterId = `gooey-${rawId}`;
  const gradId = `gooey-grad-${rawId}`;
  const specId = `gooey-spec-${rawId}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SVGGElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const coreRef = useRef<SVGEllipseElement>(null);
  const shineRef = useRef<SVGEllipseElement>(null);
  const dropRef = useRef<SVGCircleElement>(null);
  const satRefs = useRef<(SVGCircleElement | null)[]>([]);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  const colorsRef = useRef({ from: colorFrom, to: colorTo });
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
    colorsRef.current = { from: colorFrom, to: colorTo };
    syncRef.current?.();
  });

  const disabled = state === 'disabled';

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const pose = (el: SVGElement | null, attrs: Record<string, string>) => {
      if (!el) return;
      for (const key in attrs) el.setAttribute(key, attrs[key]);
    };

    const setVars = (fromColor: string, toColor: string) => {
      host.style.setProperty('--goo-from', fromColor);
      host.style.setProperty('--goo-to', toColor);
    };

    const setStaticPose = () => {
      sceneRef.current?.setAttribute('transform', 'translate(0 0)');
      dispRef.current?.setAttribute('scale', '7');
      pose(coreRef.current, { cx: '50', cy: '50', rx: String(CORE_R), ry: String(CORE_R) });
      pose(shineRef.current, {
        cx: (50 - CORE_R * 0.24).toFixed(2),
        cy: (50 - CORE_R * 0.3).toFixed(2),
        rx: (CORE_R * 0.45).toFixed(2),
        ry: (CORE_R * 0.34).toFixed(2),
      });
      SATELLITES.forEach((s, i) => {
        pose(satRefs.current[i] ?? null, { cx: STATIC_POSE[i].cx, cy: STATIC_POSE[i].cy });
      });
      dropRef.current?.setAttribute('r', '0');
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const applyStatic = () => {
        setStaticPose();
        const error = stateRef.current === 'error';
        setVars(
          error ? ROSE_FROM : colorsRef.current.from,
          error ? ROSE_TO : colorsRef.current.to,
        );
      };
      applyStatic();
      syncRef.current = applyStatic;
      return () => {
        syncRef.current = null;
      };
    }

    host.style.transition = 'opacity 400ms ease, filter 400ms ease';

    let raf = 0;
    let running = false;
    let last: number | null = null;
    let t = 0;
    let phX = 0.7;
    let phY = 2.1;
    let phB = 0;
    let level = 0.06;
    let prevLevel = level;
    let amp = 6;
    let squash = 0;
    let lastFrom = '';
    let lastTo = '';
    let dropStart: number | null = null;
    let dropAngle = 0;
    let lastDrop = -2;
    const theta = SATELLITES.map((s) => s.phase);
    const dist = SATELLITES.map((s) => s.staticD);
    const mix = createStateMix(stateRef.current);

    const frame = (now: number) => {
      if (last === null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const step = dt * speedRef.current;
      t += step;

      const weights = mix.update(st, dt);
      const wThink = weights.thinking;
      const wConnect = weights.connecting;
      const wSpeak = weights.speaking;
      const wError = weights.error;
      const wDisabled = weights.disabled;

      phX += step * (0.3 + 0.65 * wThink + 0.25 * wConnect);
      phY += step * (0.22 + 0.3 * wThink + 0.33 * wConnect);
      phB += step * 0.75;

      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const raw = hasLive
        ? live
        : stateEnergy('connecting', t) * wConnect +
          stateEnergy('listening', t) * weights.listening +
          stateEnergy('thinking', t) * wThink +
          stateEnergy('speaking', t) * wSpeak +
          stateEnergy('error', t) * wError;
      const floor = 0.055 + 0.05 * Math.sin(phB);
      level = approach(level, Math.max(raw, floor), 7, dt);
      const rising = level - prevLevel;
      prevLevel = level;

      const ampTarget =
        6 * weights.idle +
        7 * wConnect +
        9 * weights.listening +
        12 * wThink +
        10 * wSpeak +
        2.5 * wError;
      amp = approach(amp, ampTarget, 4, dt);
      squash = approach(squash, 0.055 * wThink, 5, dt);

      const away = 1 - wDisabled;
      const dx = amp * Math.sin(phX) * away;
      const dy = amp * Math.sin(phY + 1.1) * away;
      const bx = 50 + dx;
      const by = 50 + dy;

      const p = wError > 0.001 ? errorPulse(t) : 0;
      let r = (CORE_R + 0.8 * Math.sin(phB) + 3.2 * level) * (1 - 0.09 * p * wError);
      let scale = 8 + 26 * level;
      scale += (6.5 + 3 * p - scale) * wError;
      r += (CORE_R - r) * wDisabled;
      scale += (7 - scale) * wDisabled;
      const sq = squash * Math.sin(phX * 2 + 1.2);

      sceneRef.current?.setAttribute('transform', `translate(${(-dx).toFixed(2)} ${(-dy).toFixed(2)})`);
      dispRef.current?.setAttribute('scale', scale.toFixed(2));
      pose(coreRef.current, {
        cx: bx.toFixed(2),
        cy: by.toFixed(2),
        rx: (r * (1 + sq)).toFixed(2),
        ry: (r * (1 - sq)).toFixed(2),
      });
      pose(shineRef.current, {
        cx: (bx - r * 0.24).toFixed(2),
        cy: (by - r * 0.3).toFixed(2),
        rx: (r * 0.45).toFixed(2),
        ry: (r * 0.34).toFixed(2),
      });

      const satLevel = (level + 0.26 * wConnect) * (1 - 0.8 * wError);
      SATELLITES.forEach((s, i) => {
        theta[i] += step * (s.w + (1.5 - s.w) * wConnect);
        const reach = s.fused + (s.detach - s.fused) * smoothstep((satLevel - s.lo) / (s.hi - s.lo));
        dist[i] = approach(dist[i], reach, 7, dt);
        const sx = bx + Math.cos(theta[i]) * dist[i];
        const sy = by + Math.sin(theta[i]) * dist[i];
        pose(satRefs.current[i] ?? null, {
          cx: (sx + (STATIC_XY[i].x - sx) * wDisabled).toFixed(2),
          cy: (sy + (STATIC_XY[i].y - sy) * wDisabled).toFixed(2),
        });
      });

      if (dropStart !== null) {
        const tau = (t - dropStart) / 0.8;
        if (tau >= 1) {
          dropStart = null;
          dropRef.current?.setAttribute('r', '0');
        } else {
          const out = 1 - (1 - tau) ** 2;
          const dd = 24 + 34 * out;
          pose(dropRef.current, {
            cx: (bx + Math.cos(dropAngle) * dd).toFixed(2),
            cy: (by + Math.sin(dropAngle) * dd).toFixed(2),
            r: (2.6 * (1 - tau) * wSpeak).toFixed(2),
          });
        }
      } else if (
        st === 'speaking' &&
        wSpeak > 0.6 &&
        level > 0.55 &&
        rising > 0.0008 &&
        t - lastDrop > 1.15
      ) {
        dropStart = t;
        lastDrop = t;
        dropAngle = theta[0] + 1.1;
      }

      const pct = Math.round(wError * 100);
      const fromVar = mixToward(colorsRef.current.from, ROSE_FROM, pct);
      const toVar = mixToward(colorsRef.current.to, ROSE_TO, pct);
      if (fromVar !== lastFrom || toVar !== lastTo) {
        lastFrom = fromVar;
        lastTo = toVar;
        setVars(fromVar, toVar);
      }

      if (st === 'disabled' && wDisabled > 0.99 && wError < 0.005 && dropStart === null) {
        setStaticPose();
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      last = null;
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    syncRef.current = start;
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      syncRef.current = null;
    };
  }, [levelRef]);

  const hostVars = { '--goo-from': colorFrom, '--goo-to': colorTo } as CSSProperties;

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        ...hostVars,
        width: size,
        height: size,
        opacity: disabled ? 0.5 : 1,
        filter: disabled ? `${SHADOW} grayscale(0.85)` : SHADOW,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden focusable="false" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={gradId} cx="36%" cy="30%" r="78%">
            <stop offset="0%" style={{ stopColor: HIGHLIGHT }} />
            <stop offset="30%" style={{ stopColor: 'var(--goo-from)' }} />
            <stop offset="62%" style={{ stopColor: MIDTONE }} />
            <stop offset="96%" style={{ stopColor: DEEP }} />
          </radialGradient>
          <radialGradient id={specId}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id={filterId} x="-40" y="-40" width="180" height="180" filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="pre" />
            <feColorMatrix in="pre" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.016" numOctaves="2" seed="7" result="grain" />
            <feDisplacementMap
              ref={dispRef}
              in="goo"
              in2="grain"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
              result="boil"
            />
            <feGaussianBlur in="boil" stdDeviation="0.4" result="soft" />
            <feColorMatrix in="soft" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 6 -2.5" />
          </filter>
        </defs>
        <g ref={sceneRef}>
          <g filter={`url(#${filterId})`}>
            {SATELLITES.map((s, i) => (
              <circle
                key={s.phase}
                ref={(el) => {
                  satRefs.current[i] = el;
                }}
                cx={STATIC_POSE[i].cx}
                cy={STATIC_POSE[i].cy}
                r={s.r}
                style={{ fill: SAT_FILLS[i] }}
              />
            ))}
            <circle ref={dropRef} cx="50" cy="50" r="0" style={{ fill: SAT_FILLS[0] }} />
            <ellipse ref={coreRef} cx="50" cy="50" rx={CORE_R} ry={CORE_R} fill={`url(#${gradId})`} />
            <ellipse
              ref={shineRef}
              cx={(50 - CORE_R * 0.24).toFixed(2)}
              cy={(50 - CORE_R * 0.3).toFixed(2)}
              rx={(CORE_R * 0.45).toFixed(2)}
              ry={(CORE_R * 0.34).toFixed(2)}
              fill={`url(#${specId})`}
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
