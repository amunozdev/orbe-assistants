'use client';

import { useCallback, useRef } from 'react';
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

const LAYER_CLASSES = [
  styles.layerIdle,
  styles.layerActive,
  styles.layerWave,
  styles.layerSweep,
  styles.layerFlat,
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
  ref,
}: OrbProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  useOrbLevel(innerRef, state, levelRef);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
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
      <span className={styles.ring} />
      <span className={styles.disc}>
        <span className={styles.glowHalo} />
        <span className={styles.glowCore} />
        <span className={styles.bars}>
          {LAYER_CLASSES.map((layerClass) => (
            <span key={layerClass} className={`${styles.layer} ${layerClass}`}>
              {BAR_CLASSES.map((barClass) => (
                <span key={barClass} className={`${styles.bar} ${barClass}`} />
              ))}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
};
