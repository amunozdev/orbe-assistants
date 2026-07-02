'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  acquireSharedAnalyser,
  classifyAudioError,
  releaseSharedAnalyser,
  type AudioLevelError,
} from './use-audio-level';

export interface AudioBands {
  bassRef: RefObject<number>;
  midRef: RefObject<number>;
  trebleRef: RefObject<number>;
  error: AudioLevelError | null;
}

const BASS_MAX_HZ = 300;
const MID_MAX_HZ = 2000;

const normalize = (value: number): number =>
  Math.min(1, Math.max(0, (value / 255 - 0.06) / 0.4));

export const useAudioBands = (active: boolean, smoothing = 0.2): AudioBands => {
  const bassRef = useRef<number>(-1);
  const midRef = useRef<number>(-1);
  const trebleRef = useRef<number>(-1);
  const [error, setError] = useState<AudioLevelError | null>(null);

  useEffect(() => {
    const reset = () => {
      bassRef.current = -1;
      midRef.current = -1;
      trebleRef.current = -1;
    };

    if (!active) {
      reset();
      return;
    }

    let cancelled = false;
    let raf = 0;

    void acquireSharedAnalyser().then(
      (analyser) => {
        if (cancelled) return;
        setError(null);
        const bins = analyser.frequencyBinCount;
        const nyquist = analyser.context.sampleRate / 2;
        const binFor = (hz: number) =>
          Math.min(bins, Math.max(1, Math.round((hz / nyquist) * bins)));
        const bassEnd = binFor(BASS_MAX_HZ);
        const midEnd = Math.max(bassEnd + 1, binFor(MID_MAX_HZ));
        const data = new Uint8Array(bins);
        let bass = 0;
        let mid = 0;
        let treble = 0;

        const average = (start: number, end: number): number => {
          let sum = 0;
          for (let i = start; i < end; i += 1) sum += data[i];
          return end > start ? sum / (end - start) : 0;
        };

        const tick = () => {
          analyser.getByteFrequencyData(data);
          bass += (normalize(average(0, bassEnd)) - bass) * smoothing;
          mid += (normalize(average(bassEnd, midEnd)) - mid) * smoothing;
          treble += (normalize(average(midEnd, bins)) - treble) * smoothing;
          bassRef.current = bass;
          midRef.current = mid;
          trebleRef.current = treble;
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(classifyAudioError(err));
        reset();
      },
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      releaseSharedAnalyser();
      reset();
    };
  }, [active, smoothing]);

  return { bassRef, midRef, trebleRef, error };
};
