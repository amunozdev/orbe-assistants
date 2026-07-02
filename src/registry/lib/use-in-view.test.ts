import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInView } from '@/registry/lib/use-in-view';

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  disconnected = false;
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  emit(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
  }
}

const setVisibility = (value: DocumentVisibilityState): void => {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  vi.unstubAllGlobals();
});

describe('useInView', () => {
  it('starts active and observes the element', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onChange = vi.fn();
    const useHarness = () => useInView(ref, onChange);
    const { result } = renderHook(useHarness);
    expect(result.current.current).toBe(true);
    expect(MockIntersectionObserver.instances.length).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires the callback when the element leaves and re-enters the viewport', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onChange = vi.fn();
    const useHarness = () => useInView(ref, onChange);
    const { result } = renderHook(useHarness);
    const observer = MockIntersectionObserver.instances[0];
    observer.emit(false);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(result.current.current).toBe(false);
    observer.emit(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(result.current.current).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not refire for unchanged activity', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onChange = vi.fn();
    const useHarness = () => useInView(ref, onChange);
    renderHook(useHarness);
    const observer = MockIntersectionObserver.instances[0];
    observer.emit(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires the callback when the page visibility changes', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onChange = vi.fn();
    const useHarness = () => useInView(ref, onChange);
    const { result } = renderHook(useHarness);
    setVisibility('hidden');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(result.current.current).toBe(false);
    setVisibility('visible');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(result.current.current).toBe(true);
  });

  it('stays inactive while hidden even if the element is in view', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const onChange = vi.fn();
    const useHarness = () => useInView(ref, onChange);
    const { result } = renderHook(useHarness);
    const observer = MockIntersectionObserver.instances[0];
    setVisibility('hidden');
    expect(onChange).toHaveBeenCalledTimes(1);
    observer.emit(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBe(false);
  });

  it('disconnects the observer and resets on unmount', () => {
    const el = document.createElement('div');
    const ref = { current: el };
    const useHarness = () => useInView(ref);
    const { result, unmount } = renderHook(useHarness);
    const observer = MockIntersectionObserver.instances[0];
    observer.emit(false);
    expect(result.current.current).toBe(false);
    unmount();
    expect(observer.disconnected).toBe(true);
    expect(result.current.current).toBe(true);
  });
});
