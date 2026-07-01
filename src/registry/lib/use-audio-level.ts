'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const describeError = (error: unknown): string => {
  if (error instanceof DOMException) return `${error.name}: ${error.message}`;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
};

export const useAudioLevel = (active: boolean, smoothing = 0.15): RefObject<number> => {
  const levelRef = useRef<number>(-1);

  useEffect(() => {
    if (!active) {
      levelRef.current = -1;
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.error(
        'useAudioLevel: navigator.mediaDevices.getUserMedia is unavailable. This usually means an insecure context (use localhost or https).',
      );
      levelRef.current = -1;
      return;
    }

    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        if (cancelled) {
          stopStream();
          return;
        }

        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        let smoothed = 0;

        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) sum += data[i];
          const avg = sum / data.length / 255;
          const norm = Math.min(1, Math.max(0, (avg - 0.06) / 0.4));
          smoothed += (norm - smoothed) * smoothing;
          levelRef.current = smoothed;
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      } catch (error) {
        console.error(`useAudioLevel: getUserMedia failed - ${describeError(error)}`);
        stopStream();
        levelRef.current = -1;
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopStream();
      void ctx?.close();
      levelRef.current = -1;
    };
  }, [active, smoothing]);

  return levelRef;
};
