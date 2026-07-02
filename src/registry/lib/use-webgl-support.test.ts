import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type GetContext = typeof HTMLCanvasElement.prototype.getContext;

const stubGetContext = (impl: (contextId: string) => unknown) => {
  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  spy.mockImplementation(impl as unknown as GetContext);
  return spy;
};

const loadHook = async () => {
  const mod = await import('@/registry/lib/use-webgl-support');
  return mod.useWebGLSupport;
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWebGLSupport', () => {
  it('returns true when webgl2 is available', async () => {
    const spy = stubGetContext((contextId) => (contextId === 'webgl2' ? {} : null));
    const useWebGLSupport = await loadHook();
    const { result } = renderHook(useWebGLSupport);
    expect(result.current).toBe(true);
    expect(spy).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true });
  });

  it('falls back to webgl1 when webgl2 is unavailable', async () => {
    const spy = stubGetContext((contextId) => (contextId === 'webgl' ? {} : null));
    const useWebGLSupport = await loadHook();
    const { result } = renderHook(useWebGLSupport);
    expect(result.current).toBe(true);
    expect(spy).toHaveBeenCalledWith('webgl', { failIfMajorPerformanceCaveat: true });
  });

  it('returns false when no GL context can be created', async () => {
    stubGetContext(() => null);
    const useWebGLSupport = await loadHook();
    const { result } = renderHook(useWebGLSupport);
    expect(result.current).toBe(false);
  });

  it('returns false when getContext throws', async () => {
    stubGetContext(() => {
      throw new Error('blocked');
    });
    const useWebGLSupport = await loadHook();
    const { result } = renderHook(useWebGLSupport);
    expect(result.current).toBe(false);
  });

  it('caches the detection result across renders', async () => {
    const spy = stubGetContext((contextId) => (contextId === 'webgl2' ? {} : null));
    const useWebGLSupport = await loadHook();
    const first = renderHook(useWebGLSupport);
    const callsAfterFirst = spy.mock.calls.length;
    const second = renderHook(useWebGLSupport);
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    expect(spy.mock.calls.length).toBe(callsAfterFirst);
  });
});
