'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './equalizer-orb.module.css';

export const EqualizerOrb = ({
  state = 'idle',
  size = 168,
  speed = 1,
  colorFrom = '#38bdf8',
  colorTo = '#818cf8',
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
      <span className={styles.glow} />
      <span className={styles.bars}>
        <span className={`${styles.bar} ${styles.bar1}`} />
        <span className={`${styles.bar} ${styles.bar2}`} />
        <span className={`${styles.bar} ${styles.bar3}`} />
        <span className={`${styles.bar} ${styles.bar4}`} />
        <span className={`${styles.bar} ${styles.bar5}`} />
        <span className={`${styles.bar} ${styles.bar6}`} />
        <span className={`${styles.bar} ${styles.bar7}`} />
      </span>
    </div>
  );
};
