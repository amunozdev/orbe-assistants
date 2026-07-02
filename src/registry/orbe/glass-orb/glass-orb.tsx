'use client';

import { useCallback, useEffect, useRef } from 'react';
import { approach, orbVars, stateEnergy, type OrbProps, type OrbState } from '../../lib/orb-state';
import { observeActivity } from '../../lib/use-in-view';
import styles from './glass-orb.module.css';

const REDUCED_LEVELS: Record<OrbState, number> = {
  idle: 0,
  connecting: 0.22,
  listening: 0.7,
  thinking: 0.4,
  speaking: 0.55,
  error: 0.2,
  disabled: 0,
};

export const GlassOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom,
  colorTo,
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.style.setProperty('--orb-level', REDUCED_LEVELS[state].toFixed(3));
  }, [state]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let running = false;
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

    const setActive = (active: boolean) => {
      if (active === running) return;
      running = active;
      if (active) {
        last = null;
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    setActive(true);
    const unobserve = observeActivity(el, setActive);
    return () => {
      unobserve();
      cancelAnimationFrame(raf);
    };
  }, [levelRef]);

  return (
    <div
      ref={setRef}
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
