import type { AdapterProvider, OrbFile } from './registry';
import { ORB_STATES } from './lib/orb-state';
import type { OrbState } from './lib/orb-state';

export interface FileWithCode extends OrbFile {
  code: string;
}

export type AdapterFilesWithCode = Record<AdapterProvider, FileWithCode>;

const OPTIONAL_STATES = ['error', 'disabled'] as const satisfies readonly OrbState[];

const stateUnion = (states: readonly OrbState[]): string =>
  states.map((s) => `'${s}'`).join(' | ');

export type PromptProvider = 'generic' | AdapterProvider;

const PROVIDER_NOTES: Record<Exclude<PromptProvider, 'generic'>, string> = {
  vapi: `Provider wiring (Vapi):
- Install @vapi-ai/web and create the client once: const vapi = new Vapi(PUBLIC_KEY).
- Map the call lifecycle to state: after vapi.start(assistantId) setState('connecting'); vapi.on('call-start', () => setState('listening')); vapi.on('speech-start', () => setState('speaking')); vapi.on('speech-end', () => setState('listening')); vapi.on('call-end', () => setState('idle')); vapi.on('error', () => setState('error')). speech-start/speech-end refer to the assistant speaking.
- Drive the level without useAudioLevel: keep const levelRef = useRef(-1) and subscribe vapi.on('volume-level', (volume) => { levelRef.current = volume; }) — volume is already normalized 0..1.
- Reset levelRef.current = -1 on call-end so the orb falls back to its procedural animation.`,
  elevenlabs: `Provider wiring (ElevenLabs Agents):
- Install @elevenlabs/react and use the useConversation hook.
- Map the callbacks to state: after conversation.startSession(...) setState('connecting'); onConnect: () => setState('listening'); onModeChange: ({ mode }) => setState(mode === 'speaking' ? 'speaking' : 'listening'); onDisconnect: () => setState('idle'); onError: () => setState('error').
- Drive the level without useAudioLevel: keep const levelRef = useRef(-1) and, while the session is connected, run a requestAnimationFrame loop that writes levelRef.current = mode === 'speaking' ? conversation.getOutputVolume() : conversation.getInputVolume() (both return 0..1).
- Reset levelRef.current = -1 when the session ends.`,
  livekit: `Provider wiring (LiveKit Agents):
- Install @livekit/components-react and render inside <LiveKitRoom>.
- const { state, audioTrack } = useVoiceAssistant() already exposes the lifecycle: map 'disconnected' to 'idle', 'connecting' and 'initializing' to 'connecting', and pass 'listening' | 'thinking' | 'speaking' straight through (same names as the orb states).
- Drive the level from the agent audio track: either copy useTrackVolume(audioTrack) (0..1, re-renders) into levelRef.current inside an effect, or attach an AnalyserNode to the track's MediaStreamTrack and write the normalized amplitude to levelRef.current in a requestAnimationFrame loop (reuse the math from the bundled use-audio-level.ts).
- Reset levelRef.current = -1 when the room disconnects.`,
  'openai-realtime': `Provider wiring (OpenAI Realtime, WebRTC):
- After creating the RTCPeerConnection and offer, setState('connecting'); when the data channel opens, setState('listening').
- Map server events from the data channel to state: 'input_audio_buffer.speech_started' -> 'listening'; 'response.created' -> 'thinking'; 'output_audio_buffer.started' (or the first audio delta) -> 'speaking'; 'output_audio_buffer.stopped' and 'response.done' -> 'listening'; 'error' -> 'error'; on connection close -> 'idle'.
- Drive the level from the remote audio: in pc.ontrack, create an AudioContext and an AnalyserNode over new MediaStream([event.track]), and in a requestAnimationFrame loop write the normalized amplitude (average of getByteFrequencyData / 255) to levelRef.current — reuse the math from the bundled use-audio-level.ts.
- Reset levelRef.current = -1 when the session closes.`,
};

export interface UsageConfig {
  state: OrbState;
  size: number;
  speed: number;
  colorFrom: string;
  colorTo: string;
}

export const buildUsageSnippet = (
  componentName: string,
  { state, size, speed, colorFrom, colorTo }: UsageConfig,
): string => {
  const dir = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `import { ${componentName} } from '@/registry/orbe/${dir}/${dir}';

export const Assistant = () => (
  <${componentName}
    state="${state}"
    size={${size}}
    speed={${speed}}
    colorFrom="${colorFrom}"
    colorTo="${colorTo}"
  />
);
`;
};

export const buildAiPrompt = (
  name: string,
  dependencies: string[],
  files: FileWithCode[],
  shared: FileWithCode[],
  provider: PromptProvider = 'generic',
  adapter?: FileWithCode,
): string => {
  const deps = dependencies.length
    ? `First install: \`${dependencies.join(' ')}\`.`
    : 'No extra dependencies are required.';
  const block = (f: FileWithCode) => `\n${f.label}\n\`\`\`${f.lang}\n${f.code}\`\`\`\n`;
  const component = name.replace(/\s+/g, '');
  const componentPath = files[0]
    ? files[0].path.replace(/^src\//, '').replace(/\.tsx?$/, '')
    : 'registry/orbe';

  return `Integrate the "${name}" animated AI-assistant orb into my React / Next.js (App Router) project.

${deps}

Create these shared utilities once (path: src/registry/lib):
${shared.map(block).join('')}
Create the component files:
${files.map(block).join('')}
Notes:
- It is a client component ("use client"). Keep the file paths shown above; if the project has no src/ directory, place them under registry/ at the project root and adjust the import paths accordingly.
- Props: state (${stateUnion(ORB_STATES)}; plus the optional extensions ${stateUnion(OPTIONAL_STATES)}), size (px), speed (multiplier), colorFrom, colorTo, levelRef (RefObject<number>; 0..1 live audio amplitude, a negative value means "no live audio" and the orb falls back to a procedural animation), label, className.
- Theming: the orb reads the CSS variables --orb-size, --orb-speed, --orb-color-from, --orb-color-to and --orb-level, so it can also be themed or animated from CSS.
- Minimal wiring: drive state from the assistant lifecycle and pass a levelRef from the bundled use-audio-level hook (mic while listening; use TTS output while speaking):
\`\`\`tsx
'use client';
import { useState } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { ${component} } from '@/${componentPath}';

export const AssistantOrb = () => {
  const [state, setState] = useState<OrbState>('idle');
  const { levelRef } = useAudioLevel(state === 'listening');
  return <${component} state={state} levelRef={levelRef} />;
};
\`\`\`
- For smooth per-frame transitions between states, orb-state.ts also exports the helpers approach() (exponential easing toward a target) and createStateMix() (blends state weights over time).
- Accessibility: render the shared <OrbStatus state={state} /> (lib/orb-status.tsx) near the orb so state changes are announced to screen readers via a polite live region, and never signal the error state by color alone (keep a visible text cue such as OrbStatus).
- Respect \`prefers-reduced-motion\`.${provider === 'generic' ? '' : `\n\n${PROVIDER_NOTES[provider]}`}${
    provider !== 'generic' && adapter
      ? `\n\nProvider adapter (copy as ${adapter.path}):\n${block(adapter)}`
      : ''
  }`;
};
