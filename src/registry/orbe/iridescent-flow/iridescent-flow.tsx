'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export const IridescentFlow = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#c084fc',
  colorTo = '#67e8f9',
  levelRef,
  label = 'Iridescent Flow orb',
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
        background: `conic-gradient(from 220deg, ${colorFrom}, ${colorTo}, ${colorFrom}88, ${colorTo}, ${colorFrom})`,
        boxShadow: `0 0 calc(14px + var(--orb-level, 0) * 26px) ${colorFrom}66`,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : 'saturate(1.2)',
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    />
  );
};
