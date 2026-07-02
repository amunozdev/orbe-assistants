import { describe, expect, it } from 'vitest';
import {
  ERROR_COLOR_FROM,
  ERROR_COLOR_TO,
  ORB_STATES,
  approach,
  createStateMix,
  hexToRgb,
  orbVars,
  stateEnergy,
  stateMotion,
  type OrbState,
  type StateWeights,
} from '@/registry/lib/orb-state';

const TIME_SAMPLES = Array.from({ length: 60 }, (_, i) => i * 0.137);

const sumWeights = (weights: StateWeights): number =>
  Object.values(weights).reduce((acc, weight) => acc + weight, 0);

describe('ORB_STATES', () => {
  it('lists the five core states without error and disabled', () => {
    expect(ORB_STATES).toEqual(['idle', 'connecting', 'listening', 'thinking', 'speaking']);
  });
});

describe('stateEnergy', () => {
  it('returns 0 for idle and disabled at any time', () => {
    for (const t of TIME_SAMPLES) {
      expect(stateEnergy('idle', t)).toBe(0);
      expect(stateEnergy('disabled', t)).toBe(0);
    }
  });

  it('returns a constant 0.2 for error', () => {
    for (const t of TIME_SAMPLES) {
      expect(stateEnergy('error', t)).toBe(0.2);
    }
  });

  it.each([
    ['listening', 0.4, 0.9],
    ['speaking', 0.3, 0.7],
    ['thinking', 0.24, 0.44],
    ['connecting', 0.12, 0.22],
  ] as const)('keeps %s bounded within [%f, %f] and oscillating', (state, min, max) => {
    const values = TIME_SAMPLES.map((t) => stateEnergy(state, t));
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
    expect(new Set(values.map((value) => value.toFixed(4))).size).toBeGreaterThan(1);
  });
});

describe('orbVars', () => {
  it('maps props to public CSS custom properties', () => {
    const vars = orbVars({
      size: 220,
      speed: 1.25,
      colorFrom: '#7c3aed',
      colorTo: '#0ea5e9',
    }) as Record<string, string>;
    expect(vars).toEqual({
      '--orb-size': '220px',
      '--orb-speed': '1.25',
      '--orb-color-from': '#7c3aed',
      '--orb-color-to': '#0ea5e9',
    });
  });

  it('omits properties that are not provided', () => {
    expect(orbVars({})).toEqual({});
    const vars = orbVars({ size: 160 }) as Record<string, string>;
    expect(vars).toEqual({ '--orb-size': '160px' });
  });

  it('keeps zero values for size and speed', () => {
    const vars = orbVars({ size: 0, speed: 0 }) as Record<string, string>;
    expect(vars['--orb-size']).toBe('0px');
    expect(vars['--orb-speed']).toBe('0');
  });
});

describe('approach', () => {
  it('moves current toward the target from both directions', () => {
    const up = approach(0, 1, 6, 1 / 60);
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThan(1);
    const down = approach(1, 0, 6, 1 / 60);
    expect(down).toBeLessThan(1);
    expect(down).toBeGreaterThan(0);
  });

  it('never overshoots the target on very large steps', () => {
    const next = approach(0, 1, 60, 10);
    expect(next).toBeLessThanOrEqual(1);
    expect(next).toBeCloseTo(1, 6);
  });

  it('returns current unchanged when dt is 0', () => {
    expect(approach(0.3, 1, 6, 0)).toBe(0.3);
  });

  it('moves further with a larger dt', () => {
    expect(approach(0, 1, 6, 1 / 30)).toBeGreaterThan(approach(0, 1, 6, 1 / 120));
  });

  it('is frame-rate independent for the same elapsed time', () => {
    let stepped = 0;
    for (let i = 0; i < 4; i += 1) stepped = approach(stepped, 1, 6, 0.025);
    const single = approach(0, 1, 6, 0.1);
    expect(stepped).toBeCloseTo(single, 10);
  });

  it('converges to the target over time', () => {
    let value = 0;
    for (let i = 0; i < 600; i += 1) value = approach(value, 0.8, 6, 1 / 60);
    expect(value).toBeCloseTo(0.8, 3);
  });
});

describe('createStateMix', () => {
  it('starts with full weight on the initial state', () => {
    const mix = createStateMix('listening');
    expect(mix.weights.listening).toBe(1);
    expect(sumWeights(mix.weights)).toBe(1);
  });

  it('defaults to idle', () => {
    expect(createStateMix().weights.idle).toBe(1);
  });

  it('returns the same weights object it mutates', () => {
    const mix = createStateMix();
    expect(mix.update('speaking', 1 / 60)).toBe(mix.weights);
  });

  it('keeps weights normalized during a transition', () => {
    const mix = createStateMix('idle');
    for (let i = 0; i < 5; i += 1) {
      const weights = mix.update('speaking', 1 / 60);
      expect(sumWeights(weights)).toBeCloseTo(1, 6);
    }
  });

  it('transitions smoothly from the previous state to the next', () => {
    const mix = createStateMix('idle');
    const first = { ...mix.update('listening', 1 / 60) };
    expect(first.idle).toBeGreaterThan(0);
    expect(first.idle).toBeLessThan(1);
    expect(first.listening).toBeGreaterThan(0);
    expect(first.listening).toBeLessThan(1);
    const second = { ...mix.update('listening', 1 / 60) };
    expect(second.listening).toBeGreaterThan(first.listening);
    expect(second.idle).toBeLessThan(first.idle);
  });

  it('converges to full weight on the active state', () => {
    const mix = createStateMix('idle');
    let weights = mix.weights;
    for (let i = 0; i < 240; i += 1) weights = mix.update('thinking', 1 / 60);
    expect(weights.thinking).toBeCloseTo(1, 3);
    for (const state of Object.keys(weights) as OrbState[]) {
      if (state !== 'thinking') expect(weights[state]).toBe(0);
    }
  });
});

describe('stateMotion', () => {
  it.each([
    ['listening', 'ripple'],
    ['thinking', 'pulse'],
    ['speaking', 'flow'],
    ['idle', 'none'],
    ['connecting', 'none'],
    ['error', 'none'],
    ['disabled', 'none'],
  ] as const)('maps %s to %s', (state, motion) => {
    expect(stateMotion(state)).toBe(motion);
  });
});

describe('hexToRgb', () => {
  it('parses 6-digit hex colors', () => {
    expect(hexToRgb('#7c3aed')).toEqual([124, 58, 237]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#0af')).toEqual([0, 170, 255]);
  });

  it('accepts hex without the leading hash', () => {
    expect(hexToRgb('ff8800')).toEqual([255, 136, 0]);
  });

  it('is case insensitive', () => {
    expect(hexToRgb('#FB7185')).toEqual([251, 113, 133]);
    expect(hexToRgb('#0AF')).toEqual([0, 170, 255]);
  });
});

describe('error color constants', () => {
  it('are distinct 6-digit hex colors', () => {
    expect(ERROR_COLOR_FROM).toMatch(/^#[0-9a-f]{6}$/);
    expect(ERROR_COLOR_TO).toMatch(/^#[0-9a-f]{6}$/);
    expect(ERROR_COLOR_FROM).not.toBe(ERROR_COLOR_TO);
  });

  it('parse to valid rgb triples', () => {
    for (const channel of [...hexToRgb(ERROR_COLOR_FROM), ...hexToRgb(ERROR_COLOR_TO)]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});
