'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ORB_STATES, type OrbState } from '@/registry/lib/orb-state';
import { OrbStatus } from '@/registry/lib/orb-status';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { useOrbCues } from '@/registry/lib/use-orb-cues';
import {
  buildAiPrompt,
  buildUsageSnippet,
  type AdapterFilesWithCode,
  type FileWithCode,
  type PromptProvider,
} from '@/registry/prompt';
import { OrbPreview } from './orb-preview';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import { ColorField } from './color-field';
import { InstallBlock } from './install-block';
import { OpenInStackblitz } from './open-in-stackblitz';
import { useDemoCycle } from './use-demo-cycle';

export interface OrbCardData {
  id: string;
  name: string;
  tagline: string;
  tech: string;
  dependencies: string[];
  defaultColorFrom: string;
  defaultColorTo: string;
  defaultSize: number;
  files: FileWithCode[];
}

const SPECIAL_STATES = ['error', 'disabled'] as const satisfies readonly OrbState[];

const MIC_ERROR_LABEL = {
  'permission-denied': 'Mic blocked',
  unavailable: 'Mic unavailable',
} as const;

const MIC_ERROR_TITLE = {
  'permission-denied': 'Microphone permission was denied. Allow mic access in the browser and try again.',
  unavailable: 'Microphone is unavailable in this browser or context (use localhost or https).',
} as const;

const STATE_LABEL: Record<OrbState, string> = {
  idle: 'idle',
  connecting: 'connecting',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  error: 'error',
  disabled: 'disabled',
};

const COST_HINT: Record<string, { label?: string; note: string }> = {
  'Pure CSS': {
    label: 'compositor only',
    note: 'Animates on the compositor thread; the cheapest option, safe on any mobile device.',
  },
  Canvas: {
    note: 'Redraws a 2D canvas every frame; moderate CPU cost, fine on most phones.',
  },
  'SVG filters': {
    note: 'SVG filter effects rasterize on the CPU; can be heavy on low-end mobile.',
  },
  'Shader (canvas)': {
    label: 'gpu',
    note: 'Fragment shader running on the GPU; smooth but battery-hungry on mobile.',
  },
  'WebGL (R3F + GLSL)': {
    label: 'gpu',
    note: 'Full WebGL scene on the GPU; the heaviest option, use sparingly on mobile.',
  },
};

const PROVIDERS: { value: PromptProvider; label: string }[] = [
  { value: 'generic', label: 'Generic' },
  { value: 'vapi', label: 'Vapi' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'livekit', label: 'LiveKit' },
  { value: 'openai-realtime', label: 'OpenAI Realtime' },
];

const stateButton = (s: OrbState, state: OrbState, setState: (next: OrbState) => void) => (
  <button
    key={s}
    type="button"
    onClick={() => setState(s)}
    aria-pressed={state === s}
    className={clsx(
      'rounded-md px-2.5 py-1 text-xs transition-colors',
      state === s ? 'bg-accent/15 text-accent-foreground' : 'text-muted hover:text-foreground',
    )}
  >
    {STATE_LABEL[s]}
  </button>
);

export const OrbCard = ({
  orb,
  shared,
  adapters,
  hideDetailsLink = false,
}: {
  orb: OrbCardData;
  shared: FileWithCode[];
  adapters: AdapterFilesWithCode;
  hideDetailsLink?: boolean;
}) => {
  const [state, setState] = useState<OrbState>('idle');
  const [mic, setMic] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(orb.defaultSize);
  const [colorFrom, setColorFrom] = useState(orb.defaultColorFrom);
  const [colorTo, setColorTo] = useState(orb.defaultColorTo);
  const [showCode, setShowCode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cues, setCues] = useState(false);
  const [provider, setProvider] = useState<PromptProvider>('generic');
  const { levelRef, error: micError } = useAudioLevel(mic);
  const [seenMicError, setSeenMicError] = useState<typeof micError>(null);
  const demo = useDemoCycle(setState);

  useOrbCues(state, { enabled: cues });

  if (micError !== seenMicError) {
    setSeenMicError(micError);
    if (micError) setMic(false);
  }

  const component = orb.name.replace(/\s+/g, '');

  const usageFile = useMemo<FileWithCode>(
    () => ({
      label: 'Usage',
      path: 'usage.tsx',
      lang: 'tsx',
      code: buildUsageSnippet(component, { state, size, speed, colorFrom, colorTo }),
    }),
    [component, state, size, speed, colorFrom, colorTo],
  );

  const codeFiles = useMemo(() => [usageFile, ...orb.files], [usageFile, orb.files]);

  const aiPrompt = useMemo(
    () =>
      `${buildAiPrompt(
        orb.name,
        orb.dependencies,
        orb.files,
        shared,
        provider,
        provider === 'generic' ? undefined : adapters[provider],
      )}

Requested configuration (current playground values, render the orb with exactly these props):
\`\`\`tsx
${usageFile.code}\`\`\``,
    [orb.name, orb.dependencies, orb.files, shared, provider, adapters, usageFile.code],
  );

  const reactive = state === 'listening' || state === 'speaking';

  const selectState = (next: OrbState) => {
    demo.stop();
    setState(next);
  };

  const toggleMic = () => {
    setMic((prev) => {
      const next = !prev;
      if (next) {
        demo.stop();
        if (state === 'idle' || state === 'connecting') setState('listening');
      }
      return next;
    });
  };

  const costHint = COST_HINT[orb.tech];

  return (
    <article
      id={orb.id}
      className="flex scroll-mt-20 flex-col gap-5 rounded-2xl border border-border bg-panel/60 p-5"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {orb.name}
            <a
              href={`#${orb.id}`}
              aria-label={`Link to ${orb.name}`}
              className="ml-1.5 text-sm font-normal text-muted transition-colors hover:text-accent-foreground"
            >
              #
            </a>
          </h2>
          <p className="mt-1 text-sm text-muted">{orb.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
          {!hideDetailsLink && (
            <Link
              href={`/orbs/${orb.id}`}
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
            >
              Details →
            </Link>
          )}
          <span
            title={costHint?.note}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
          >
            {orb.tech}
          </span>
          {costHint?.label && (
            <span
              title={costHint.note}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
            >
              {costHint.label}
            </span>
          )}
          {orb.dependencies.length === 0 && (
            <span
              title="No external dependencies; copy the files and it just works."
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted"
            >
              Zero deps
            </span>
          )}
        </div>
      </header>

      <div className="grid min-h-64 place-items-center rounded-xl border border-border bg-[radial-gradient(circle_at_50%_30%,var(--orb-stage-from),var(--orb-stage-to))]">
        <OrbPreview
          id={orb.id}
          state={state}
          size={size}
          speed={speed}
          colorFrom={colorFrom}
          colorTo={colorTo}
          levelRef={reactive ? levelRef : undefined}
          label={orb.name}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label="Orb state" className="flex flex-wrap items-center gap-1.5">
          {ORB_STATES.map((s) => stateButton(s, state, selectState))}
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
          {SPECIAL_STATES.map((s) => stateButton(s, state, selectState))}
        </div>
        <button
          type="button"
          onClick={demo.toggle}
          aria-pressed={demo.running}
          title="Simulate a voice conversation: cycles idle, connecting, listening, thinking and speaking. Click any state or the mic to interrupt."
          className={clsx(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            demo.running ? 'bg-accent/15 text-accent-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          {demo.running ? '■ Demo' : '▶ Demo'}
        </button>
        <button
          type="button"
          onClick={() => setCues((prev) => !prev)}
          aria-pressed={cues}
          title="Play subtle sound cues (and haptics on supported devices) on state changes"
          className={clsx(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            cues ? 'bg-accent/15 text-accent-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          {cues ? '● Cues on' : 'Cues off'}
        </button>
        <OrbStatus state={state} className="ml-auto text-[11px] text-muted" />
        <button
          type="button"
          onClick={toggleMic}
          aria-pressed={mic && !micError}
          disabled={state === 'disabled'}
          title={
            micError
              ? MIC_ERROR_TITLE[micError]
              : 'React to your microphone in listening/speaking states'
          }
          className={clsx(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            micError
              ? 'border border-foreground/40 text-foreground'
              : mic
                ? 'bg-accent/15 text-accent-foreground'
                : 'text-muted hover:text-foreground',
          )}
        >
          {micError ? MIC_ERROR_LABEL[micError] : mic ? '● Mic on' : 'Mic off'}
        </button>
      </div>

      <div className="grid grid-cols-1 items-center gap-x-5 gap-y-4 text-xs text-muted sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span>Speed · {speed.toFixed(2)}×</span>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="accent-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span>Size · {size}px</span>
          <input
            type="range"
            min={96}
            max={240}
            step={4}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="accent-accent"
          />
        </label>
        <ColorField label="From" value={colorFrom} onChange={setColorFrom} />
        <ColorField label="To" value={colorTo} onChange={setColorTo} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={aiPrompt} label="Copy AI prompt" />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            for
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as PromptProvider)}
              className="rounded-md border border-border bg-panel px-2 py-1.5 text-xs font-medium text-foreground"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowPrompt((v) => !v)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
          >
            {showPrompt ? 'Hide prompt' : 'View prompt'}
          </button>
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
          >
            {showCode ? 'Hide code' : 'View code'}
          </button>
          <OpenInStackblitz
            id={orb.id}
            name={orb.name}
            dependencies={orb.dependencies}
            files={orb.files}
            shared={shared}
            config={{ state, size, speed, colorFrom, colorTo }}
          />
        </div>
        {orb.dependencies.length > 0 && <InstallBlock dependencies={orb.dependencies} />}
        {showPrompt && (
          <div className="relative rounded-lg border border-border bg-code">
            <div className="absolute top-2 right-2 z-10">
              <CopyButton value={aiPrompt} label="Copy" />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-code-muted">
              {aiPrompt}
            </pre>
          </div>
        )}
        {showCode && <CodeBlock files={codeFiles} />}
      </footer>
    </article>
  );
};
