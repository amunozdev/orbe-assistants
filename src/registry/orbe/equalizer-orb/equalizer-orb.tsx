'use client';

import { useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './equalizer-orb.module.css';

const BAR_CLASSES = [
  styles.bar1,
  styles.bar2,
  styles.bar3,
  styles.bar4,
  styles.bar5,
  styles.bar6,
  styles.bar7,
];

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
      <span className={styles.ring} />
      <span className={styles.disc}>
        <span className={styles.glowHalo} />
        <span className={styles.glowCore} />
        <span className={styles.bars}>
          {BAR_CLASSES.map((barClass) => (
            <span key={barClass} className={`${styles.bar} ${barClass}`} />
          ))}
        </span>
      </span>
    </div>
  );
};
