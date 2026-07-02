'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import {
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  type OrbProps,
  type OrbState,
} from '../../lib/orb-state';
import { useWebGLSupport } from '../../lib/use-webgl-support';

const NebulaScene = dynamic(() => import('./nebula-scene').then((m) => m.NebulaScene), {
  ssr: false,
});

const GLOW: Record<OrbState, number> = {
  idle: 0.45,
  connecting: 0.6,
  listening: 0.85,
  thinking: 0.65,
  speaking: 0.95,
  error: 0.7,
  disabled: 0.2,
};

const CORE_SCALE: Record<OrbState, number> = {
  idle: 0.94,
  connecting: 0.97,
  listening: 1.04,
  thinking: 0.99,
  speaking: 1.07,
  error: 1,
  disabled: 0.9,
};

const subscribeReducedMotion = (onChange: () => void): (() => void) => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const getServerReducedMotion = (): boolean => false;

const glowLayer = (
  from: string,
  to: string,
  opacity: number,
  fade: string | undefined,
): CSSProperties => ({
  position: 'absolute',
  inset: '-16%',
  borderRadius: '50%',
  background: `radial-gradient(circle at 50% 44%, color-mix(in srgb, ${to} 32%, transparent) 0%, color-mix(in srgb, ${from} 20%, transparent) 44%, transparent 70%)`,
  opacity,
  transition: fade,
});

export const NebulaOrb = ({
  state = 'idle',
  size = 180,
  speed = 1,
  colorFrom = '#8b5cf6',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);
  const webgl = useWebGLSupport();
  const fade = reduced ? undefined : 'opacity 600ms ease';
  const glow = GLOW[state];
  const isError = state === 'error';
  const vars = {
    '--nebula-from': colorFrom,
    '--nebula-to': colorTo,
    '--nebula-error-from': ERROR_COLOR_FROM,
    '--nebula-error-to': ERROR_COLOR_TO,
    '--nebula-live-from': isError ? ERROR_COLOR_FROM : colorFrom,
    '--nebula-live-to': isError ? ERROR_COLOR_TO : colorTo,
  } as CSSProperties;
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={className}
      style={{
        ...vars,
        position: 'relative',
        width: size,
        height: size,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: reduced ? undefined : 'opacity 400ms ease, filter 400ms ease',
      }}
    >
      <div
        aria-hidden
        style={glowLayer('var(--nebula-from)', 'var(--nebula-to)', isError ? 0 : glow, fade)}
      />
      <div
        aria-hidden
        style={glowLayer(
          'var(--nebula-error-from)',
          'var(--nebula-error-to)',
          isError ? glow : 0,
          fade,
        )}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '17%',
          right: '17%',
          bottom: '-6%',
          height: '13%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.12) 45%, transparent 72%)',
          opacity: 0.4 + glow * 0.5,
          transition: fade,
        }}
      />
      {webgl !== true && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '10%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 36% 30%, color-mix(in srgb, var(--nebula-live-to) 78%, white) 0%, var(--nebula-live-to) 32%, var(--nebula-live-from) 66%, color-mix(in srgb, var(--nebula-live-from) 55%, black) 100%)',
            opacity: 0.55 + glow * 0.45,
            transform: `scale(${CORE_SCALE[state]})`,
            transition: reduced ? undefined : 'opacity 600ms ease, transform 600ms ease',
          }}
        />
      )}
      {webgl === true && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <NebulaScene state={state} speed={speed} colorFrom={colorFrom} colorTo={colorTo} levelRef={levelRef} />
        </div>
      )}
    </div>
  );
};
