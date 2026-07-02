'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { approach, stateEnergy, type OrbState } from './orb-state';

export const useOrbLevel = (
  ref: RefObject<HTMLElement | null>,
  state: OrbState,
  levelRef?: RefObject<number>,
) => {
  const smoothedRef = useRef(0);
  const clockRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--orb-level', '0');
      return;
    }

    let raf = 0;
    let last: number | null = null;

    const frame = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      clockRef.current += dt;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(state, clockRef.current);
      smoothedRef.current = approach(smoothedRef.current, target, 7.7, dt);
      el.style.setProperty('--orb-level', smoothedRef.current.toFixed(3));
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ref, state, levelRef]);
};
