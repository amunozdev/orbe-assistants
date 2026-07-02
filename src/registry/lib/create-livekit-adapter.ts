import type { RefObject } from 'react';
import { approach } from './orb-state';
import type { OrbState } from './orb-state';

export type LiveKitAgentState =
  | 'disconnected'
  | 'connecting'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking';

export const mapAgentState = (agentState: LiveKitAgentState): OrbState => {
  switch (agentState) {
    case 'disconnected':
      return 'idle';
    case 'connecting':
    case 'initializing':
      return 'connecting';
    default:
      return agentState;
  }
};

export interface LiveKitTrackReferenceLike {
  publication?: {
    track?: {
      mediaStreamTrack?: MediaStreamTrack;
    };
  };
}

export interface LiveKitOrbAdapter {
  levelRef: RefObject<number>;
  setTrack: (trackRef?: LiveKitTrackReferenceLike) => void;
  dispose: () => void;
}

export const createLiveKitAdapter = (): LiveKitOrbAdapter => {
  const levelRef: RefObject<number> = { current: -1 };
  let ctx: AudioContext | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let currentTrack: MediaStreamTrack | null = null;
  let raf = 0;

  const detachTrack = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    sourceNode?.disconnect();
    sourceNode = null;
    currentTrack = null;
    levelRef.current = -1;
  };

  const attachTrack = (track: MediaStreamTrack) => {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    sourceNode = ctx.createMediaStreamSource(new MediaStream([track]));
    sourceNode.connect(analyser);
    currentTrack = track;
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

  const setTrack = (trackRef?: LiveKitTrackReferenceLike) => {
    const track = trackRef?.publication?.track?.mediaStreamTrack ?? null;
    if (track === currentTrack) return;
    detachTrack();
    if (track) attachTrack(track);
  };

  const dispose = () => {
    detachTrack();
    if (ctx) void ctx.close();
    ctx = null;
  };

  return { levelRef, setTrack, dispose };
};
