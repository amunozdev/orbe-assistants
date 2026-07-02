import type { RefObject } from 'react';
import type { OrbState } from './orb-state';

export interface VapiAdapterEvents {
  'call-start': () => void;
  'call-end': () => void;
  'speech-start': () => void;
  'speech-end': () => void;
  'volume-level': (volume: number) => void;
  error: (error: unknown) => void;
}

export interface VapiClientLike {
  on<E extends keyof VapiAdapterEvents>(event: E, listener: VapiAdapterEvents[E]): unknown;
  off<E extends keyof VapiAdapterEvents>(event: E, listener: VapiAdapterEvents[E]): unknown;
}

export interface VapiOrbAdapter {
  levelRef: RefObject<number>;
  getState: () => OrbState;
  subscribe: (listener: (state: OrbState) => void) => () => void;
  setState: (state: OrbState) => void;
  dispose: () => void;
}

export const createVapiAdapter = (vapi: VapiClientLike): VapiOrbAdapter => {
  const levelRef: RefObject<number> = { current: -1 };
  const listeners = new Set<(state: OrbState) => void>();
  let state: OrbState = 'idle';

  const setState = (next: OrbState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener(next);
  };

  const onCallStart = () => setState('listening');
  const onCallEnd = () => {
    levelRef.current = -1;
    setState('idle');
  };
  const onSpeechStart = () => setState('speaking');
  const onSpeechEnd = () => setState('listening');
  const onVolumeLevel = (volume: number) => {
    levelRef.current = Math.min(1, Math.max(0, volume));
  };
  const onError = () => setState('error');

  vapi.on('call-start', onCallStart);
  vapi.on('call-end', onCallEnd);
  vapi.on('speech-start', onSpeechStart);
  vapi.on('speech-end', onSpeechEnd);
  vapi.on('volume-level', onVolumeLevel);
  vapi.on('error', onError);

  const dispose = () => {
    vapi.off('call-start', onCallStart);
    vapi.off('call-end', onCallEnd);
    vapi.off('speech-start', onSpeechStart);
    vapi.off('speech-end', onSpeechEnd);
    vapi.off('volume-level', onVolumeLevel);
    vapi.off('error', onError);
    listeners.clear();
    levelRef.current = -1;
  };

  return {
    levelRef,
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
