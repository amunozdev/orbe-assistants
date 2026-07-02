'use client';

import { useEffect, useId, useRef } from 'react';
import { orbVars, stateEnergy, type OrbProps } from '../../lib/orb-state';

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

const STATIC_POSE = SATELLITES.map((s) => ({
  cx: (50 + Math.cos(s.phase) * s.staticD).toFixed(2),
  cy: (50 + Math.sin(s.phase) * s.staticD).toFixed(2),
}));

const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

const errorPulse = (t: number) => {
  const p = (t % 1.5) / 1.5;
  const beat = (center: number) => Math.exp(-(((p - center) / 0.055) ** 2));
  return beat(0.1) + beat(0.32);
};

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
  const sceneRef = useRef<SVGGElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const coreRef = useRef<SVGEllipseElement>(null);
  const shineRef = useRef<SVGEllipseElement>(null);
  const dropRef = useRef<SVGCircleElement>(null);
  const satRefs = useRef<(SVGCircleElement | null)[]>([]);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);

  useEffect(() => {
    stateRef.current = state;
    speedRef.current = speed;
  });

  const disabled = state === 'disabled';

  useEffect(() => {
    const pose = (el: SVGElement | null, attrs: Record<string, string>) => {
      if (!el) return;
      for (const key in attrs) el.setAttribute(key, attrs[key]);
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

    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStaticPose();
      return;
    }

    let raf = 0;
    let last: number | null = null;
    let t = 0;
    let phX = 0.7;
    let phY = 2.1;
    let phB = 0;
    let level = 0.06;
    let prevLevel = level;
    let amp = 6;
    let squash = 0;
    const theta = SATELLITES.map((s) => s.phase);
    const dist = SATELLITES.map((s) => s.staticD);
    let dropStart: number | null = null;
    let dropAngle = 0;
    let lastDrop = -2;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (last === null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const step = dt * speedRef.current;
      t += step;

      const kneading = st === 'thinking';
      const orbiting = st === 'connecting';
      phX += step * (kneading ? 0.95 : orbiting ? 0.55 : 0.3);
      phY += step * (kneading ? 0.52 : orbiting ? 0.55 : 0.22);
      phB += step * 0.75;

      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const raw = hasLive ? live : stateEnergy(st, t);
      const floor = 0.055 + 0.05 * Math.sin(phB);
      level += (Math.max(raw, floor) - level) * 0.12;
      const rising = level - prevLevel;
      prevLevel = level;

      const ampTarget =
        st === 'error' ? 2.5
        : kneading ? 12
        : st === 'speaking' ? 10
        : st === 'listening' ? 9
        : orbiting ? 7
        : 6;
      amp += (ampTarget - amp) * 0.03;
      squash += ((kneading ? 0.055 : 0) - squash) * 0.05;

      const dx = amp * Math.sin(phX);
      const dy = amp * Math.sin(phY + 1.1);
      const bx = 50 + dx;
      const by = 50 + dy;

      let r = CORE_R + 0.8 * Math.sin(phB) + 3.2 * level;
      let scale = 8 + 26 * level;
      if (st === 'error') {
        const p = errorPulse(t);
        r *= 1 - 0.09 * p;
        scale = 6.5 + 3 * p;
      }
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

      const satLevel = st === 'error' ? level * 0.2 : level + (orbiting ? 0.26 : 0);
      SATELLITES.forEach((s, i) => {
        theta[i] += step * (orbiting ? 1.5 : s.w);
        const reach = s.fused + (s.detach - s.fused) * smoothstep((satLevel - s.lo) / (s.hi - s.lo));
        dist[i] += (reach - dist[i]) * 0.12;
        pose(satRefs.current[i] ?? null, {
          cx: (bx + Math.cos(theta[i]) * dist[i]).toFixed(2),
          cy: (by + Math.sin(theta[i]) * dist[i]).toFixed(2),
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
            r: (2.6 * (1 - tau)).toFixed(2),
          });
        }
      } else if (st === 'speaking' && level > 0.55 && rising > 0.0008 && t - lastDrop > 1.15) {
        dropStart = t;
        lastDrop = t;
        dropAngle = theta[0] + 1.1;
      }
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = null;
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [levelRef, disabled]);

  const from = state === 'error' ? '#fb7185' : colorFrom;
  const to = state === 'error' ? '#f43f5e' : colorTo;
  const highlight = `color-mix(in oklab, #ffffff 74%, ${from})`;
  const midtone = `color-mix(in oklab, ${from} 46%, ${to})`;
  const deep = `color-mix(in oklab, ${to} 84%, #000000)`;
  const satFills = [
    `color-mix(in oklab, ${from} 55%, ${to})`,
    to,
    `color-mix(in oklab, ${to} 76%, #000000)`,
  ];
  const shadow = `drop-shadow(0 7px 18px color-mix(in oklab, ${to} 26%, transparent)) drop-shadow(0 2px 7px color-mix(in oklab, ${from} 18%, transparent))`;

  return (
    <div
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        opacity: disabled ? 0.5 : 1,
        filter: disabled ? `${shadow} grayscale(0.85)` : shadow,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden focusable="false" style={{ display: 'block' }}>
        <defs>
          <radialGradient id={gradId} cx="36%" cy="30%" r="78%">
            <stop offset="0%" style={{ stopColor: highlight }} />
            <stop offset="30%" style={{ stopColor: from }} />
            <stop offset="62%" style={{ stopColor: midtone }} />
            <stop offset="96%" style={{ stopColor: deep }} />
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
                style={{ fill: satFills[i] }}
              />
            ))}
            <circle ref={dropRef} cx="50" cy="50" r="0" style={{ fill: satFills[0] }} />
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
