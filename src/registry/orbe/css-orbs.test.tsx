import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrbProps } from '@/registry/lib/orb-state';
import { EqualizerOrb } from '@/registry/orbe/equalizer-orb/equalizer-orb';
import { GlassOrb } from '@/registry/orbe/glass-orb/glass-orb';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';

const stubReducedMotion = (): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      (query: string) =>
        ({
          matches: true,
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

beforeEach(() => {
  stubReducedMotion();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([
  { name: 'PulseOrb', Orb: PulseOrb },
  { name: 'GlassOrb', Orb: GlassOrb },
  { name: 'EqualizerOrb', Orb: EqualizerOrb },
] satisfies { name: string; Orb: (props: OrbProps) => ReactElement }[])(
  '$name',
  ({ Orb }) => {
    it('renders an img role with the default accessible label', () => {
      render(<Orb />);
      expect(screen.getByRole('img', { name: 'Assistant orb' })).toBeDefined();
    });

    it('uses a custom label when provided', () => {
      render(<Orb label="Voice assistant" />);
      expect(screen.getByRole('img', { name: 'Voice assistant' })).toBeDefined();
    });

    it('reflects the state prop through data-state', () => {
      const { rerender } = render(<Orb state="listening" />);
      const el = screen.getByRole('img');
      expect(el.getAttribute('data-state')).toBe('listening');
      rerender(<Orb state="error" />);
      expect(el.getAttribute('data-state')).toBe('error');
      rerender(<Orb state="disabled" />);
      expect(el.getAttribute('data-state')).toBe('disabled');
    });

    it('defaults data-state to idle', () => {
      render(<Orb />);
      expect(screen.getByRole('img').getAttribute('data-state')).toBe('idle');
    });

    it('merges a custom className with the base class', () => {
      render(<Orb className="extra-class" />);
      const el = screen.getByRole('img');
      expect(el.classList.contains('extra-class')).toBe(true);
      expect(el.classList.length).toBeGreaterThan(1);
    });

    it('exposes the root element through the ref prop', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Orb ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByRole('img'));
    });

    it('supports a callback ref', () => {
      let node: HTMLDivElement | null = null;
      render(
        <Orb
          ref={(el) => {
            node = el;
          }}
        />,
      );
      expect(node).toBe(screen.getByRole('img'));
    });
  },
);
