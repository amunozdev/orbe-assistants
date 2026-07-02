'use client';

import { useSyncExternalStore } from 'react';

let cached: boolean | null = null;

const detect = (): boolean => {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const attributes: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
    cached =
      canvas.getContext('webgl2', attributes) !== null ||
      canvas.getContext('webgl', attributes) !== null;
  } catch {
    cached = false;
  }
  return cached;
};

const subscribe = (): (() => void) => () => {};
const getSnapshot = (): boolean | null => detect();
const getServerSnapshot = (): boolean | null => null;

export const useWebGLSupport = (): boolean | null =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
