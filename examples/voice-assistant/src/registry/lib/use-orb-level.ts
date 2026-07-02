'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { approach, stateEnergy, type OrbState } from './orb-state';
import { observeActivity } from './use-in-view';

export interface OrbBandRefs {
  bassRef: RefObject<number>;
  midRef: RefObject<number>;
  trebleRef: RefObject<number>;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const useOrbLevel = (
  ref: RefObject<HTMLElement | null>,
  state: OrbState,
  levelRef?: RefObject<number>,
  bands?: OrbBandRefs,
) => {
  const smoothedRef = useRef(0);
  const clockRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--orb-level', '0');
      el.style.setProperty('--orb-bass', '0');
      el.style.setProperty('--orb-mid', '0');
      el.style.setProperty('--orb-treble', '0');
      return;
    }

    let raf = 0;
    let last: number | null = null;
    let active = true;

    const frame = (now: number) => {
      raf = 0;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      clockRef.current += dt;
      const live = levelRef?.current;
      const hasLive = typeof live === 'number' && live >= 0;
      const target = hasLive ? live : stateEnergy(state, clockRef.current);
      smoothedRef.current = approach(smoothedRef.current, target, 7.7, dt);
      const level = smoothedRef.current;
      const t = clockRef.current;
      const liveBass = bands?.bassRef.current ?? -1;
      const liveMid = bands?.midRef.current ?? -1;
      const liveTreble = bands?.trebleRef.current ?? -1;
      const bass = liveBass >= 0 ? liveBass : clamp01(level * (0.78 + 0.22 * Math.sin(t * 2.3)));
      const mid = liveMid >= 0 ? liveMid : clamp01(level * (0.78 + 0.22 * Math.sin(t * 3.4 + 2.1)));
      const treble =
        liveTreble >= 0 ? liveTreble : clamp01(level * (0.78 + 0.22 * Math.sin(t * 4.6 + 4.2)));
      el.style.setProperty('--orb-level', level.toFixed(3));
      el.style.setProperty('--orb-bass', bass.toFixed(3));
      el.style.setProperty('--orb-mid', mid.toFixed(3));
      el.style.setProperty('--orb-treble', treble.toFixed(3));
      if (active) raf = requestAnimationFrame(frame);
      else last = null;
    };

    const wake = () => {
      if (raf === 0) raf = requestAnimationFrame(frame);
    };

    const halt = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      last = null;
    };

    const unobserve = observeActivity(el, (next) => {
      active = next;
      if (next) wake();
      else halt();
    });

    wake();

    return () => {
      halt();
      unobserve();
    };
  }, [ref, state, levelRef, bands]);
};
