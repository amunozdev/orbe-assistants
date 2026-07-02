'use client';

import dynamic from 'next/dynamic';
import { type OrbProps, type OrbState } from '../../lib/orb-state';

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

export const NebulaOrb = ({
  state = 'idle',
  size = 180,
  speed = 1,
  colorFrom = '#8b5cf6',
  colorTo = '#22d3ee',
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const glowFrom = state === 'error' ? '#fb7185' : colorFrom;
  const glowTo = state === 'error' ? '#f43f5e' : colorTo;
  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-16%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 44%, color-mix(in srgb, ${glowTo} 32%, transparent) 0%, color-mix(in srgb, ${glowFrom} 20%, transparent) 44%, transparent 70%)`,
          opacity: GLOW[state],
          transition: 'opacity 600ms ease',
        }}
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
          opacity: 0.4 + GLOW[state] * 0.5,
          transition: 'opacity 600ms ease',
        }}
      />
      <div style={{ position: 'absolute', inset: 0 }}>
        <NebulaScene state={state} speed={speed} colorFrom={colorFrom} colorTo={colorTo} levelRef={levelRef} />
      </div>
    </div>
  );
};
