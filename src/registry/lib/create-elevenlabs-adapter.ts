import type { RefObject } from 'react';
import { approach } from './orb-state';
import type { OrbState } from './orb-state';

export type ElevenLabsMode = 'speaking' | 'listening';

export interface ElevenLabsConversationLike {
  getInputVolume: () => number;
  getOutputVolume: () => number;
}

export interface ElevenLabsAdapterCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onModeChange: (event: { mode: ElevenLabsMode }) => void;
  onError: () => void;
}

export interface ElevenLabsOrbAdapter {
  levelRef: RefObject<number>;
  callbacks: ElevenLabsAdapterCallbacks;
  attach: (conversation: ElevenLabsConversationLike) => () => void;
  getState: () => OrbState;
  subscribe: (listener: (state: OrbState) => void) => () => void;
  setState: (state: OrbState) => void;
  dispose: () => void;
}

export const createElevenLabsAdapter = (): ElevenLabsOrbAdapter => {
  const levelRef: RefObject<number> = { current: -1 };
  const listeners = new Set<(state: OrbState) => void>();
  let state: OrbState = 'idle';
  let mode: ElevenLabsMode = 'listening';
  let source: ElevenLabsConversationLike | null = null;
  let connected = false;
  let raf = 0;
  let last = 0;

  const setState = (next: OrbState) => {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener(next);
  };

  const tick = (now: number) => {
    if (!source || !connected) {
      raf = 0;
      return;
    }
    const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
    last = now;
    const volume = mode === 'speaking' ? source.getOutputVolume() : source.getInputVolume();
    const target = Math.min(1, Math.max(0, volume));
    const current = levelRef.current < 0 ? 0 : levelRef.current;
    levelRef.current = approach(current, target, 14, dt);
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf || !source || !connected) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    levelRef.current = -1;
  };

  const callbacks: ElevenLabsAdapterCallbacks = {
    onConnect: () => {
      connected = true;
      setState('listening');
      start();
    },
    onDisconnect: () => {
      connected = false;
      stop();
      setState('idle');
    },
    onModeChange: ({ mode: next }) => {
      mode = next;
      setState(next === 'speaking' ? 'speaking' : 'listening');
    },
    onError: () => setState('error'),
  };

  const attach = (conversation: ElevenLabsConversationLike) => {
    source = conversation;
    start();
    return () => {
      if (source !== conversation) return;
      source = null;
      stop();
    };
  };

  const dispose = () => {
    connected = false;
    source = null;
    stop();
    listeners.clear();
  };

  return {
    levelRef,
    callbacks,
    attach,
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
