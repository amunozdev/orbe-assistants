'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ORB_STATES, type OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import type { FileWithCode } from '@/registry/prompt';
import { OrbPreview } from './orb-preview';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';

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
  aiPrompt: string;
}

const STATE_LABEL: Record<OrbState, string> = {
  idle: 'idle',
  connecting: 'connecting',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  error: 'error',
  disabled: 'disabled',
};

export const OrbCard = ({ orb }: { orb: OrbCardData }) => {
  const [state, setState] = useState<OrbState>('idle');
  const [mic, setMic] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [size, setSize] = useState(orb.defaultSize);
  const [colorFrom, setColorFrom] = useState(orb.defaultColorFrom);
  const [colorTo, setColorTo] = useState(orb.defaultColorTo);
  const [showCode, setShowCode] = useState(false);
  const levelRef = useAudioLevel(mic);

  const reactive = state === 'listening' || state === 'speaking';

  const toggleMic = () => {
    setMic((prev) => {
      const next = !prev;
      if (next && (state === 'idle' || state === 'connecting')) setState('listening');
      return next;
    });
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-panel/60 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{orb.name}</h2>
          <p className="mt-1 text-sm text-muted">{orb.tagline}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
          {orb.tech}
        </span>
      </header>

      <div className="grid min-h-56 place-items-center rounded-xl border border-border bg-[radial-gradient(circle_at_50%_30%,#11131f,#06070d)]">
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

      <div className="flex flex-wrap gap-1.5">
        {ORB_STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={clsx(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              state === s
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-muted hover:text-foreground',
            )}
          >
            {STATE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-muted">
        <label className="flex flex-col gap-1">
          <span>Velocidad · {speed.toFixed(2)}×</span>
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
        <label className="flex flex-col gap-1">
          <span>Tamaño · {size}px</span>
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
        <label className="flex items-center gap-2">
          <input type="color" value={colorFrom} onChange={(e) => setColorFrom(e.target.value)} className="h-7 w-9 rounded border border-border bg-transparent" />
          <span>colorFrom</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="color" value={colorTo} onChange={(e) => setColorTo(e.target.value)} className="h-7 w-9 rounded border border-border bg-transparent" />
          <span>colorTo</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleMic}
          className={clsx(
            'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
            mic ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted hover:text-foreground',
          )}
        >
          {mic ? '● Micrófono activo' : 'Usar micrófono'}
        </button>
        {mic && !reactive && (
          <span className="text-[11px] text-muted">Cambia a listening/speaking para reaccionar a la voz</span>
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-4">
        {orb.dependencies.length > 0 && (
          <p className="font-mono text-[11px] text-muted">npm i {orb.dependencies.join(' ')}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <CopyButton value={orb.aiPrompt} label="Copiar prompt para IA" />
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {showCode ? 'Ocultar código' : 'Ver código'}
          </button>
        </div>
        {showCode && <CodeBlock files={orb.files} />}
      </footer>
    </article>
  );
};
