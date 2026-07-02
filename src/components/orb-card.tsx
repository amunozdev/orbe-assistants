'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ORB_STATES, type OrbState } from '@/registry/lib/orb-state';
import { OrbStatus } from '@/registry/lib/orb-status';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { buildAiPrompt, type FileWithCode } from '@/registry/prompt';
import { OrbPreview } from './orb-preview';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';
import { ColorField } from './color-field';

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

export const OrbCard = ({ orb, shared }: { orb: OrbCardData; shared: FileWithCode[] }) => {
  const [state, setState] = useState<OrbState>('idle');
  const [mic, setMic] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(orb.defaultSize);
  const [colorFrom, setColorFrom] = useState(orb.defaultColorFrom);
  const [colorTo, setColorTo] = useState(orb.defaultColorTo);
  const [showCode, setShowCode] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { levelRef, error: micError } = useAudioLevel(mic);
  const [seenMicError, setSeenMicError] = useState<typeof micError>(null);

  if (micError !== seenMicError) {
    setSeenMicError(micError);
    if (micError) setMic(false);
  }

  const aiPrompt = useMemo(
    () => buildAiPrompt(orb.name, orb.dependencies, orb.files, shared),
    [orb.name, orb.dependencies, orb.files, shared],
  );

  const reactive = state === 'listening' || state === 'speaking';

  const toggleMic = () => {
    setMic((prev) => {
      const next = !prev;
      if (next && (state === 'idle' || state === 'connecting')) setState('listening');
      return next;
    });
  };

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border bg-panel/60 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{orb.name}</h2>
          <p className="mt-1 text-sm text-muted">{orb.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
          {orb.tech}
        </span>
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
          {ORB_STATES.map((s) => stateButton(s, state, setState))}
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
          {SPECIAL_STATES.map((s) => stateButton(s, state, setState))}
        </div>
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

      <div className="grid grid-cols-2 items-center gap-x-5 gap-y-4 text-xs text-muted">
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
          {orb.dependencies.length > 0 && (
            <p className="ml-auto truncate font-mono text-[11px] text-muted">npm i {orb.dependencies.join(' ')}</p>
          )}
        </div>
        {showPrompt && (
          <div className="relative rounded-lg border border-border bg-[#080a12]">
            <div className="absolute top-2 right-2 z-10">
              <CopyButton value={aiPrompt} label="Copy" />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-muted">
              {aiPrompt}
            </pre>
          </div>
        )}
        {showCode && <CodeBlock files={orb.files} />}
      </footer>
    </article>
  );
};
