export interface Recipe {
  id: string;
  name: string;
  badge: string;
  intro: string;
  adapterPath?: string;
  code: string;
}

export const recipes: Recipe[] = [
  {
    id: 'microphone',
    name: 'Plain microphone',
    badge: 'No dependencies',
    intro:
      'The simplest wiring: drive state yourself and feed levelRef from the bundled use-audio-level hook, which reads the microphone through a shared AnalyserNode. When levelRef is negative the orb falls back to its procedural animation, so the orb keeps moving even before the user grants mic access.',
    adapterPath: 'src/registry/lib/use-audio-level.ts',
    code: `'use client';

import { useState } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';

export const MicrophoneOrb = () => {
  const [state, setState] = useState<OrbState>('idle');
  const { levelRef, error } = useAudioLevel(state === 'listening');

  return (
    <div className="flex flex-col items-center gap-4">
      <PulseOrb state={error ? 'error' : state} levelRef={levelRef} />
      <button
        type="button"
        onClick={() => setState(state === 'listening' ? 'idle' : 'listening')}
      >
        {state === 'listening' ? 'Stop' : 'Listen'}
      </button>
    </div>
  );
};
`,
  },
  {
    id: 'vapi',
    name: 'Vapi',
    badge: 'npm i @vapi-ai/web',
    intro:
      'createVapiAdapter subscribes to the Vapi web client events: call-start and call-end drive the lifecycle, speech-start and speech-end mark when the assistant is speaking, and volume-level (already normalized 0..1) feeds levelRef directly. The client is typed structurally, so the adapter compiles without the SDK installed.',
    adapterPath: 'src/registry/lib/create-vapi-adapter.ts',
    code: `'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import Vapi from '@vapi-ai/web';
import type { OrbState } from '@/registry/lib/orb-state';
import { createVapiAdapter } from '@/registry/lib/create-vapi-adapter';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
const serverState = (): OrbState => 'idle';

export const VapiOrb = () => {
  const adapter = useMemo(() => createVapiAdapter(vapi), []);
  useEffect(() => adapter.dispose, [adapter]);
  const state = useSyncExternalStore(adapter.subscribe, adapter.getState, serverState);

  const toggle = () => {
    if (state === 'idle' || state === 'error') {
      adapter.setState('connecting');
      void vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
    } else {
      void vapi.stop();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <PulseOrb state={state} levelRef={adapter.levelRef} />
      <button type="button" onClick={toggle}>
        {state === 'idle' || state === 'error' ? 'Start call' : 'End call'}
      </button>
    </div>
  );
};
`,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs Agents',
    badge: 'npm i @elevenlabs/react',
    intro:
      'createElevenLabsAdapter exposes a callbacks object you spread into useConversation: onConnect, onDisconnect and onError drive the lifecycle and onModeChange switches between listening and speaking. Once attached, it polls getInputVolume while listening and getOutputVolume while speaking in a requestAnimationFrame loop, smoothing the value into levelRef with approach().',
    adapterPath: 'src/registry/lib/create-elevenlabs-adapter.ts',
    code: `'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { OrbState } from '@/registry/lib/orb-state';
import { createElevenLabsAdapter } from '@/registry/lib/create-elevenlabs-adapter';
import { GlassOrb } from '@/registry/orbe/glass-orb/glass-orb';

const serverState = (): OrbState => 'idle';

export const ElevenLabsOrb = () => {
  const adapter = useMemo(() => createElevenLabsAdapter(), []);
  const conversation = useConversation(adapter.callbacks);
  useEffect(() => adapter.attach(conversation), [adapter, conversation]);
  useEffect(() => adapter.dispose, [adapter]);
  const state = useSyncExternalStore(adapter.subscribe, adapter.getState, serverState);

  const start = async () => {
    adapter.setState('connecting');
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await conversation.startSession({
      agentId: 'YOUR_AGENT_ID',
      connectionType: 'webrtc',
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GlassOrb state={state} levelRef={adapter.levelRef} />
      {state === 'idle' || state === 'error' ? (
        <button type="button" onClick={() => void start()}>
          Start conversation
        </button>
      ) : (
        <button type="button" onClick={() => void conversation.endSession()}>
          End conversation
        </button>
      )}
    </div>
  );
};
`,
  },
  {
    id: 'livekit',
    name: 'LiveKit Agents',
    badge: 'npm i @livekit/components-react livekit-client',
    intro:
      'useVoiceAssistant already exposes the agent lifecycle, so mapAgentState translates its AgentState to the orb contract: disconnected becomes idle, connecting and initializing become connecting, and listening, thinking and speaking pass straight through. createLiveKitAdapter hangs an AnalyserNode off the agent audio track and writes the smoothed amplitude to levelRef.',
    adapterPath: 'src/registry/lib/create-livekit-adapter.ts',
    code: `'use client';

import { useEffect, useMemo } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
} from '@livekit/components-react';
import {
  createLiveKitAdapter,
  mapAgentState,
} from '@/registry/lib/create-livekit-adapter';
import { NebulaOrb } from '@/registry/orbe/nebula-orb/nebula-orb';

const AgentOrb = () => {
  const { state, audioTrack } = useVoiceAssistant();
  const adapter = useMemo(() => createLiveKitAdapter(), []);
  useEffect(() => adapter.setTrack(audioTrack), [adapter, audioTrack]);
  useEffect(() => adapter.dispose, [adapter]);

  return <NebulaOrb state={mapAgentState(state)} levelRef={adapter.levelRef} />;
};

export const LiveKitOrb = ({ token }: { token: string }) => (
  <LiveKitRoom serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!} token={token} audio>
    <AgentOrb />
    <RoomAudioRenderer />
  </LiveKitRoom>
);
`,
  },
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime',
    badge: 'WebRTC, no SDK required',
    intro:
      'createRealtimeAdapter works on the raw WebRTC session: point pc.ontrack at handleTrack so the remote audio track feeds levelRef through an AnalyserNode, and forward data channel messages to handleServerEvent, which maps server events (speech_started, response.created, output_audio_buffer.started and stopped, response.done, error) to orb states.',
    adapterPath: 'src/registry/lib/create-realtime-adapter.ts',
    code: `'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { createRealtimeAdapter } from '@/registry/lib/create-realtime-adapter';
import { PlasmaOrb } from '@/registry/orbe/plasma-orb/plasma-orb';

const serverState = (): OrbState => 'idle';

export const RealtimeOrb = ({ ephemeralKey }: { ephemeralKey: string }) => {
  const adapter = useMemo(() => createRealtimeAdapter(), []);
  useEffect(() => adapter.dispose, [adapter]);
  const state = useSyncExternalStore(adapter.subscribe, adapter.getState, serverState);

  const connect = async () => {
    adapter.setState('connecting');
    const pc = new RTCPeerConnection();
    pc.ontrack = adapter.handleTrack;

    const speaker = new Audio();
    speaker.autoplay = true;
    pc.addEventListener('track', (event) => {
      speaker.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    });

    const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of mic.getTracks()) pc.addTrack(track, mic);

    const channel = pc.createDataChannel('oai-events');
    channel.addEventListener('open', () => adapter.setState('listening'));
    channel.addEventListener('message', (event) => {
      adapter.handleServerEvent(JSON.parse(event.data as string) as { type: string });
    });
    channel.addEventListener('close', () => adapter.setState('idle'));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const response = await fetch(
      'https://api.openai.com/v1/realtime/calls?model=gpt-realtime',
      {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${ephemeralKey}\`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      },
    );
    await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <PlasmaOrb state={state} levelRef={adapter.levelRef} />
      <button type="button" onClick={() => void connect()} disabled={state !== 'idle'}>
        Connect
      </button>
    </div>
  );
};
`,
  },
];
