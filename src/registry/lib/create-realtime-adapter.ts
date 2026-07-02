import type { RefObject } from 'react';
import { approach } from './orb-state';
import type { OrbState } from './orb-state';

export interface RealtimeServerEventLike {
  type: string;
}

export interface RealtimeTrackEventLike {
  track: MediaStreamTrack;
}

export interface RealtimeOrbAdapter {
  levelRef: RefObject<number>;
  handleTrack: (event: RealtimeTrackEventLike) => void;
  handleServerEvent: (event: RealtimeServerEventLike) => void;
  getState: () => OrbState;
  subscribe: (listener: (state: OrbState) => void) => () => void;
  setState: (state: OrbState) => void;
  dispose: () => void;
}

const STATE_BY_EVENT: Record<string, OrbState> = {
  'input_audio_buffer.speech_started': 'listening',
  'response.created': 'thinking',
  'output_audio_buffer.started': 'speaking',
  'response.output_audio.delta': 'speaking',
  'response.audio.delta': 'speaking',
  'output_audio_buffer.stopped': 'listening',
  'response.done': 'listening',
  error: 'error',
};

export const createRealtimeAdapter = (): RealtimeOrbAdapter => {
  const levelRef: RefObject<number> = { current: -1 };
  const listeners = new Set<(state: OrbState) => void>();
  let state: OrbState = 'idle';
  let ctx: AudioContext | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let raf = 0;

  const setState = (next: OrbState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener(next);
  };

  const stopLevel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    sourceNode?.disconnect();
    sourceNode = null;
    levelRef.current = -1;
  };

  const handleTrack = (event: RealtimeTrackEventLike) => {
    stopLevel();
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    sourceNode = ctx.createMediaStreamSource(new MediaStream([event.track]));
    sourceNode.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
      last = now;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i];
      const avg = sum / data.length / 255;
      const target = Math.min(1, Math.max(0, (avg - 0.06) / 0.4));
      const current = levelRef.current < 0 ? 0 : levelRef.current;
      levelRef.current = approach(current, target, 14, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const handleServerEvent = (event: RealtimeServerEventLike) => {
    const next = STATE_BY_EVENT[event.type];
    if (next) setState(next);
  };

  const dispose = () => {
    stopLevel();
    if (ctx) void ctx.close();
    ctx = null;
    listeners.clear();
  };

  return {
    levelRef,
    handleTrack,
    handleServerEvent,
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setState,
    dispose,
  };
};
