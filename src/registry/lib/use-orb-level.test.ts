import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrbLevel } from '@/registry/lib/use-orb-level';

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let now: number;

const step = (ms: number): void => {
  now += ms;
  const pending = [...frames.values()];
  frames.clear();
  for (const frame of pending) frame(now);
};

const stubMatchMedia = (reduced: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      (query: string) =>
        ({
          matches: reduced,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    ),
  );
};

const readVar = (el: HTMLElement, name: string): string => el.style.getPropertyValue(name);

beforeEach(() => {
  frames = new Map();
  nextFrameId = 0;
  now = 0;
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    nextFrameId += 1;
    frames.set(nextFrameId, callback);
    return nextFrameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
    frames.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useOrbLevel', () => {
  it('zeroes every var and schedules no frames under reduced motion', () => {
    stubMatchMedia(true);
    const el = document.createElement('div');
    const ref = { current: el };
    const useHarness = () => useOrbLevel(ref, 'listening');
    renderHook(useHarness);
    expect(readVar(el, '--orb-level')).toBe('0');
    expect(readVar(el, '--orb-bass')).toBe('0');
    expect(readVar(el, '--orb-mid')).toBe('0');
    expect(readVar(el, '--orb-treble')).toBe('0');
    expect(frames.size).toBe(0);
    expect(MockIntersectionObserver.instances.length).toBe(0);
  });

  it('writes --orb-level and band vars on the element each frame', () => {
    stubMatchMedia(false);
    const el = document.createElement('div');
    const ref = { current: el };
    const useHarness = () => useOrbLevel(ref, 'listening');
    renderHook(useHarness);
    expect(frames.size).toBe(1);
    step(0);
    expect(readVar(el, '--orb-level')).toBe('0.000');
    step(16);
    step(16);
    const level = Number.parseFloat(readVar(el, '--orb-level'));
    expect(level).toBeGreaterThan(0);
    expect(level).toBeLessThanOrEqual(1);
    for (const band of ['--orb-bass', '--orb-mid', '--orb-treble']) {
      const value = Number.parseFloat(readVar(el, band));
      expect(Number.isNaN(value)).toBe(false);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(frames.size).toBe(1);
  });

  it('smoothly tracks a live levelRef instead of procedural energy', () => {
    stubMatchMedia(false);
    const el = document.createElement('div');
    const ref = { current: el };
    const levelRef = { current: 0.8 };
    const useHarness = () => useOrbLevel(ref, 'idle', levelRef);
    renderHook(useHarness);
    step(0);
    for (let i = 0; i < 120; i += 1) step(16);
    expect(Number.parseFloat(readVar(el, '--orb-level'))).toBeCloseTo(0.8, 2);
  });

  it('falls back to procedural energy when levelRef is negative', () => {
    stubMatchMedia(false);
    const el = document.createElement('div');
    const ref = { current: el };
    const levelRef = { current: -1 };
    const useHarness = () => useOrbLevel(ref, 'listening', levelRef);
    renderHook(useHarness);
    step(0);
    for (let i = 0; i < 30; i += 1) step(16);
    expect(Number.parseFloat(readVar(el, '--orb-level'))).toBeGreaterThan(0);
  });

  it('halts frames when the element becomes inactive and resumes when active', () => {
    stubMatchMedia(false);
    const el = document.createElement('div');
    const ref = { current: el };
    const useHarness = () => useOrbLevel(ref, 'speaking');
    renderHook(useHarness);
    step(0);
    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();
    observer.emit(false);
    expect(frames.size).toBe(0);
    observer.emit(true);
    expect(frames.size).toBe(1);
    step(16);
    expect(frames.size).toBe(1);
  });

  it('cancels the pending frame on unmount', () => {
    stubMatchMedia(false);
    const el = document.createElement('div');
    const ref = { current: el };
    const useHarness = () => useOrbLevel(ref, 'thinking');
    const { unmount } = renderHook(useHarness);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
  });
});
