'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './halo-orb.module.css';

export const HaloOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#818cf8',
  colorTo = '#f472b6',
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
      <span className={styles.halo} />
      <span className={`${styles.orbit} ${styles.orbit1}`} />
      <span className={`${styles.orbit} ${styles.orbit2}`} />
      <span className={styles.disc} />
      <span className={styles.core} />
    </div>
  );
};
