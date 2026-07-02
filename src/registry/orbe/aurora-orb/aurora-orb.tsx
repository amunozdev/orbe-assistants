'use client';

import { useCallback, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './aurora-orb.module.css';

export const AuroraOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#22d3ee',
  colorTo = '#a855f7',
  levelRef,
  label = 'Assistant orb',
  className,
  ref,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useOrbLevel(innerRef, state, levelRef);

  return (
    <div
      ref={setRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({ size, speed, colorFrom, colorTo })}
    >
      <span className={styles.halo} />
      <span className={styles.sky}>
        <span className={styles.stars} />
        <span className={`${styles.veil} ${styles.veilBack}`}>
          <span className={`${styles.drift} ${styles.driftBack}`} />
        </span>
        <span className={`${styles.veil} ${styles.veilMid}`}>
          <span className={`${styles.drift} ${styles.driftMid}`} />
        </span>
        <span className={`${styles.veil} ${styles.veilFront}`}>
          <span className={`${styles.drift} ${styles.driftFront}`} />
        </span>
        <span className={styles.film} />
      </span>
    </div>
  );
};
