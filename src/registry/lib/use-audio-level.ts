'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export type AudioLevelError = 'permission-denied' | 'unavailable';

interface SharedAudio {
  ctx: AudioContext;
  stream: MediaStream;
  analyser: AnalyserNode;
}

let engine: Promise<SharedAudio> | null = null;
let consumers = 0;

const createShared = async (): Promise<SharedAudio> => {
  if (!hasAudioInputSupport()) {
    throw new DOMException(
      'getUserMedia is unavailable. This usually means an insecure context (use localhost or https).',
      'NotSupportedError',
    );
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);
  return { ctx, stream, analyser };
};

const teardown = () => {
  const current = engine;
  engine = null;
  if (!current) return;
  void current.then(
    (shared) => {
      shared.stream.getTracks().forEach((track) => track.stop());
      void shared.ctx.close();
    },
    () => {},
  );
};

export const acquireSharedAnalyser = (): Promise<AnalyserNode> => {
  consumers += 1;
  if (!engine) engine = createShared();
  const current = engine;
  return current.then(
    (shared) => shared.analyser,
    (error: unknown) => {
      if (engine === current) engine = null;
      throw error;
    },
  );
};

export const releaseSharedAnalyser = () => {
  consumers = Math.max(0, consumers - 1);
  if (consumers === 0) teardown();
};

export const classifyAudioError = (error: unknown): AudioLevelError =>
  error instanceof DOMException &&
  (error.name === 'NotAllowedError' || error.name === 'SecurityError')
    ? 'permission-denied'
    : 'unavailable';

export const hasAudioInputSupport = (): boolean =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

const VOICE_MIN_HZ = 85;
const VOICE_MAX_HZ = 3800;
const LEVEL_FLOOR = 0.14;
const LEVEL_RANGE = 0.62;
const PEAK_WEIGHT = 0.35;

export interface AudioLevel {
  levelRef: RefObject<number>;
  error: AudioLevelError | null;
}

export const useAudioLevel = (active: boolean, smoothing = 0.15): AudioLevel => {
  const levelRef = useRef<number>(-1);
  const [error, setError] = useState<AudioLevelError | null>(null);

  useEffect(() => {
    if (!active) {
      levelRef.current = -1;
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
        const voiceLo = binFor(VOICE_MIN_HZ);
        const voiceHi = Math.max(voiceLo + 1, binFor(VOICE_MAX_HZ));
        const data = new Uint8Array(bins);
        let smoothed = 0;

        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          let peak = 0;
          for (let i = voiceLo; i < voiceHi; i += 1) {
            const value = data[i];
            sum += value;
            if (value > peak) peak = value;
          }
          const bandAvg = sum / (voiceHi - voiceLo) / 255;
          const bandPeak = peak / 255;
          const energy = (1 - PEAK_WEIGHT) * bandAvg + PEAK_WEIGHT * bandPeak;
          const norm = Math.min(1, Math.max(0, (energy - LEVEL_FLOOR) / LEVEL_RANGE));
          smoothed += (norm - smoothed) * smoothing;
          levelRef.current = smoothed;
          raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      },
      (err: unknown) => {
        if (cancelled) return;
        setError(classifyAudioError(err));
        levelRef.current = -1;
      },
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      releaseSharedAnalyser();
      levelRef.current = -1;
    };
  }, [active, smoothing]);

  return { levelRef, error };
};
