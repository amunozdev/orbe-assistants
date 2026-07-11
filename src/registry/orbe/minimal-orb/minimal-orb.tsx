'use client';

import { useCallback, useRef } from 'react';
import { orbVars, type OrbProps } from '../../lib/orb-state';
import { useOrbLevel } from '../../lib/use-orb-level';
import styles from './minimal-orb.module.css';

export const MinimalOrb = ({
  state = 'idle',
  size = 168,
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

  return (
    <div
      ref={setRef}
      role="img"
      aria-label={label}
      data-state={state}
      className={[styles.orb, className].filter(Boolean).join(' ')}
      style={orbVars({ size, speed, colorFrom, colorTo })}
    >
      <span className={styles.shaker}>
        <span className={styles.disc}>
          <span className={styles.spin}>
            <span className={styles.spinTurbo} />
          </span>
        </span>
        <span className={styles.mark} />
      </span>
    </div>
  );
};
