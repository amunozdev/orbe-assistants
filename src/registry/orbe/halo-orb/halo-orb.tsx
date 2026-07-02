'use client';

import { useCallback, useRef } from 'react';
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
  ref: refProp,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof refProp === 'function') {
        refProp(node);
      } else if (refProp) {
        refProp.current = node;
      }
    },
    [refProp],
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
      <span className={styles.glow} />
      <span className={`${styles.halo} ${styles.haloB}`} />
      <span className={`${styles.halo} ${styles.haloA}`} />
      <span className={styles.disc} />
      <span className={styles.core} />
      <span className={`${styles.orbit} ${styles.orbitA}`} />
      <span className={`${styles.orbit} ${styles.orbitB}`} />
      <span className={styles.sparks} />
    </div>
  );
};
