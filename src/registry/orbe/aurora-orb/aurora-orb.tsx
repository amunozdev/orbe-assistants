'use client';

import { useRef } from 'react';
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
}: OrbProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useOrbLevel(ref, state, levelRef);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({ size, speed, colorFrom, colorTo })}
    >
      <span className={`${styles.veil} ${styles.veil1}`} />
      <span className={`${styles.veil} ${styles.veil2}`} />
      <span className={`${styles.veil} ${styles.veil3}`} />
      <span className={styles.sheen} />
      <span className={styles.rim} />
    </div>
  );
};
