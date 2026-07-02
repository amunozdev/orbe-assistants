'use client';

import { useEffect, useRef } from 'react';
import type { OrbState } from './orb-state';

export interface OrbCuesOptions {
  enabled?: boolean;
  haptics?: boolean;
  volume?: number;
}

interface CueTone {
  freq: number;
  type: OscillatorType;
  delay: number;
  duration: number;
  gain: number;
}

interface Cue {
  tones: CueTone[];
  vibration: number | number[];
}

const CUES: Partial<Record<OrbState, Cue>> = {
  listening: {
    tones: [{ freq: 880, type: 'sine', delay: 0, duration: 0.14, gain: 1 }],
    vibration: 12,
  },
  thinking: {
    tones: [{ freq: 320, type: 'triangle', delay: 0, duration: 0.05, gain: 0.7 }],
    vibration: 8,
  },
  speaking: {
    tones: [
      { freq: 523.25, type: 'sine', delay: 0, duration: 0.12, gain: 0.8 },
      { freq: 783.99, type: 'sine', delay: 0.09, duration: 0.16, gain: 1 },
    ],
    vibration: [10, 40, 10],
  },
  error: {
    tones: [
      { freq: 164.81, type: 'square', delay: 0, duration: 0.24, gain: 0.6 },
      { freq: 175, type: 'square', delay: 0, duration: 0.24, gain: 0.6 },
    ],
    vibration: [60, 40, 60],
  },
};

const playCue = (ctx: AudioContext, cue: Cue, volume: number) => {
  for (const tone of cue.tones) {
    const t0 = ctx.currentTime + tone.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume * tone.gain, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + tone.duration + 0.02);
  }
};

export const useOrbCues = (
  state: OrbState,
  { enabled = true, haptics = true, volume = 0.2 }: OrbCuesOptions = {},
) => {
  const prevRef = useRef(state);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (!enabled || prev === state) return;

    const cue = CUES[state];
    if (!cue) return;

    if (!ctxRef.current && typeof window !== 'undefined' && 'AudioContext' in window) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== 'closed') {
      if (ctx.state === 'suspended') void ctx.resume();
      playCue(ctx, cue, Math.min(1, Math.max(0, volume)));
    }

    if (haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(cue.vibration);
    }
  }, [state, enabled, haptics, volume]);

  useEffect(
    () => () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    },
    [],
  );
};
