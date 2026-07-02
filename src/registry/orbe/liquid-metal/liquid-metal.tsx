'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export const LiquidMetal = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#94a3b8',
  colorTo = '#e2e8f0',
  levelRef,
  label = 'Liquid Metal orb',
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
        background: `radial-gradient(circle at 34% 28%, ${colorTo}, ${colorFrom} 52%, #1e293b 96%)`,
        boxShadow: `inset -8px -10px 24px rgba(15, 23, 42, 0.55), 0 0 calc(10px + var(--orb-level, 0) * 22px) ${colorTo}44`,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    />
  );
};
