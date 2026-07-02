'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './pulse-orb.module.css';

export const PulseOrb = ({
  state = 'idle',
  size = 160,
  speed = 1,
  colorFrom,
  colorTo,
  levelRef,
  label = 'Assistant orb',
  className,
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);
  const isError = state === 'error';

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({
        size,
        speed,
        colorFrom: isError ? '#fb7185' : colorFrom,
        colorTo: isError ? '#f43f5e' : colorTo,
      })}
    >
      <span className={styles.glow} />
      <span className={`${styles.ring} ${styles.ring1}`} />
      <span className={`${styles.ring} ${styles.ring2}`} />
      <span className={`${styles.ring} ${styles.ring3}`} />
      <span className={styles.arc} />
      <span className={styles.core} />
    </div>
  );
};
