'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export const WaveformRing = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#2dd4bf',
  colorTo = '#38bdf8',
  levelRef,
  label = 'Waveform Ring orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${colorFrom}`,
        background: `radial-gradient(circle at 50% 42%, ${colorFrom}33, ${colorTo}18 60%, transparent 78%)`,
        boxShadow: `0 0 calc(12px + var(--orb-level, 0) * 24px) ${colorTo}55`,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    />
  );
};
