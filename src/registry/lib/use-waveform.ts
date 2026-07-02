'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  acquireSharedAnalyser,
  classifyAudioError,
  releaseSharedAnalyser,
  type AudioLevelError,
} from './use-audio-level';

export interface Waveform {
  samplesRef: RefObject<Uint8Array>;
  error: AudioLevelError | null;
}

const EMPTY = new Uint8Array(0);

export const useWaveform = (active: boolean): Waveform => {
  const samplesRef = useRef<Uint8Array>(EMPTY);
  const [error, setError] = useState<AudioLevelError | null>(null);

  useEffect(() => {
    if (!active) {
      samplesRef.current = EMPTY;
      return;
    }

    let cancelled = false;
    let raf = 0;

    void acquireSharedAnalyser().then(
      (analyser) => {
        if (cancelled) return;
        setError(null);
        const data = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(data);
          samplesRef.current = data;
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(classifyAudioError(err));
        samplesRef.current = EMPTY;
      },
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      releaseSharedAnalyser();
      samplesRef.current = EMPTY;
    };
  }, [active]);

  return { samplesRef, error };
};
