'use client';

import { useCallback, useRef } from 'react';
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
  ref,
}: OrbProps) => {
  const internalRef = useRef<HTMLDivElement | null>(null);
  useOrbLevel(internalRef, state, levelRef);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const ringSets = [styles.ringSetIdle, styles.ringSetListen, styles.ringSetSpeak];

  return (
    <div
      ref={setRef}
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
