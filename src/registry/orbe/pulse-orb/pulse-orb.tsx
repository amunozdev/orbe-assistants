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
  const ringSets = [styles.ringSetIdle, styles.ringSetListen, styles.ringSetSpeak];

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
      {ringSets.map((set) => (
        <span key={set} className={`${styles.ringSet} ${set}`}>
          <span className={`${styles.ring} ${styles.ring1}`} />
          <span className={`${styles.ring} ${styles.ring2}`} />
          <span className={`${styles.ring} ${styles.ring3}`} />
        </span>
      ))}
      <span className={styles.arc}>
        <span className={styles.arcSpin}>
          <span className={styles.arcTurbo} />
        </span>
      </span>
      <span className={styles.coreShell}>
        <span className={styles.core} />
      </span>
    </div>
  );
};
