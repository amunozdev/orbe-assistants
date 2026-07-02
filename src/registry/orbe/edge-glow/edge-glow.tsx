'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';

export interface EdgeGlowProps extends OrbProps {
  children?: ReactNode;
}

export const EdgeGlow = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#f472b6',
  colorTo = '#60a5fa',
  levelRef,
  label = 'Edge Glow frame',
  className,
  children,
}: EdgeGlowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const hasChildren = children != null;

  return (
    <div
      ref={ref}
      role={hasChildren ? undefined : 'img'}
      aria-label={hasChildren ? undefined : label}
      data-state={state}
      className={className}
      style={{
        ...orbVars({ size, speed, colorFrom, colorTo }),
        position: 'relative',
        width: hasChildren ? '100%' : size,
        height: hasChildren ? '100%' : size,
        borderRadius: 24,
        opacity: state === 'disabled' ? 0.5 : 1,
        filter: state === 'disabled' ? 'grayscale(0.85)' : undefined,
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `conic-gradient(from 0deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
          filter: 'blur(10px)',
          opacity: 'calc(0.45 + var(--orb-level, 0) * 0.55)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: 20,
          background: 'rgba(10, 12, 20, 0.9)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {children ?? (
          <span
            aria-hidden
            style={{
              fontSize: Math.max(12, size * 0.09),
              color: colorTo,
              opacity: 0.85,
            }}
          >
            Your UI here
          </span>
        )}
      </div>
    </div>
  );
};
