'use client';

import { useEffect, useRef } from 'react';
import { approach, orbVars, stateEnergy, type OrbProps } from '../../lib/orb-state';
import styles from './glass-orb.module.css';

export const GlassOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom,
  colorTo,
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--orb-level', '0');
      return;
    }

    let raf = 0;
    let start: number | null = null;
    let last: number | null = null;
    let smoothed = 0;

    const frame = (now: number) => {
      if (start === null) start = now;
      const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = (now - start) / 1000;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(stateRef.current, t);
      smoothed = approach(smoothed, target, 7.7, dt);
      el.style.setProperty('--orb-level', smoothed.toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({ size, speed, colorFrom, colorTo })}
    >
      <span className={styles.halo} />
      <span className={styles.aura} />
      <span className={styles.sphere} />
      <span className={styles.sheen} />
      <span className={styles.rim} />
      <span className={styles.spec} />
      <span className={styles.orbit} />
      <span className={styles.counter} />
      <span className={styles.grain} />
    </div>
  );
};
