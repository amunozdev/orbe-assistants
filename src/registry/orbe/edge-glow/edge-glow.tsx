'use client';

import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { ERROR_COLOR_FROM, ERROR_COLOR_TO, orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './edge-glow.module.css';

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
  ref,
  children,
}: EdgeGlowProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useOrbLevel(innerRef, state, levelRef);
  const hasChildren = children != null;
  const isError = state === 'error';

  return (
    <div
      ref={mergedRef}
      role={hasChildren ? undefined : 'img'}
      aria-label={hasChildren ? undefined : label}
      data-state={state}
      className={[styles.frame, className].filter(Boolean).join(' ')}
      style={{
        ...orbVars({
          size,
          speed,
          colorFrom: isError ? ERROR_COLOR_FROM : colorFrom,
          colorTo: isError ? ERROR_COLOR_TO : colorTo,
        }),
        width: hasChildren ? '100%' : size,
        height: hasChildren ? '100%' : size,
      }}
    >
      <span aria-hidden className={styles.aura} />
      <span aria-hidden className={styles.band} />
      <span aria-hidden className={styles.sweep} />
      <span aria-hidden className={styles.chase} />
      <div className={hasChildren ? styles.content : `${styles.content} ${styles.demo}`}>
        {children ?? (
          <span aria-hidden className={styles.demoLabel}>
            Your UI here
          </span>
        )}
      </div>
    </div>
  );
};
