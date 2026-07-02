import { useEffect, useState } from 'react';
import { PulseOrb } from './registry/orbe/pulse-orb/pulse-orb';
import { OrbStatus } from './registry/lib/orb-status';
import { useAudioLevel, type AudioLevelError } from './registry/lib/use-audio-level';
import type { OrbState } from './registry/lib/orb-state';

const CONNECT_MS = 1200;
const THINK_MS = 1500;
const SPEAK_MS = 3200;
const SILENCE_MS = 1600;
const MIC_TIMEOUT_MS = 8000;
const VOICE_THRESHOLD = 0.12;

const HINTS: Record<OrbState, string> = {
  idle: 'Press Connect to start a session.',
  connecting: 'Establishing the session.',
  listening: 'Speak into your microphone, then pause. The orb follows your voice level.',
  thinking: 'Silence detected. The assistant is preparing a reply.',
  speaking: 'The assistant replies with a procedural level, then listens again.',
  error: 'Microphone access failed. Allow the microphone and press Connect to retry.',
  disabled: 'The assistant is muted.',
};

export const App = () => {
  const [state, setState] = useState<OrbState>('idle');
  const micActive = state === 'listening';
  const { levelRef, error } = useAudioLevel(micActive);
  const [seenError, setSeenError] = useState<AudioLevelError | null>(null);

  if (error !== seenError) {
    setSeenError(error);
    if (error) setState('error');
  }

  useEffect(() => {
    if (state === 'connecting') {
      const id = window.setTimeout(() => setState('listening'), CONNECT_MS);
      return () => window.clearTimeout(id);
    }
    if (state === 'thinking') {
      const id = window.setTimeout(() => setState('speaking'), THINK_MS);
      return () => window.clearTimeout(id);
    }
    if (state === 'speaking') {
      const id = window.setTimeout(() => setState('listening'), SPEAK_MS);
      return () => window.clearTimeout(id);
    }
  }, [state]);

  useEffect(() => {
    if (state !== 'listening') return;
    const start = performance.now();
    let spoke = false;
    let lastVoice = performance.now();
    const id = window.setInterval(() => {
      const level = levelRef.current;
      const now = performance.now();
      if (level < 0) {
        if (now - start > MIC_TIMEOUT_MS) setState('error');
        lastVoice = now;
        return;
      }
      if (level > VOICE_THRESHOLD) {
        spoke = true;
        lastVoice = now;
        return;
      }
      if (spoke && now - lastVoice > SILENCE_MS) setState('thinking');
    }, 120);
    return () => window.clearInterval(id);
  }, [state, levelRef]);

  const connected = state !== 'idle' && state !== 'error';

  return (
    <main className="page">
      <header className="header">
        <h1 className="title">Voice assistant</h1>
        <p className="subtitle">PulseOrb wired to the OrbProps contract</p>
      </header>
      <PulseOrb state={state} size={220} levelRef={levelRef} label="Voice assistant orb" />
      <OrbStatus state={state} className="status" />
      <div className="controls">
        <button
          type="button"
          className="button primary"
          onClick={() => setState('connecting')}
          disabled={connected}
        >
          Connect
        </button>
        <button
          type="button"
          className="button"
          onClick={() => setState('idle')}
          disabled={!connected}
        >
          Disconnect
        </button>
      </div>
      <p className="hint" data-error={state === 'error' || undefined}>
        {HINTS[state]}
      </p>
    </main>
  );
};
