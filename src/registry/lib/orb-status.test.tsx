import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrbStatus } from '@/registry/lib/orb-status';

describe('OrbStatus', () => {
  it('renders a polite atomic live region with role status', () => {
    render(<OrbStatus state="listening" />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
  });

  it.each([
    ['idle', 'Idle'],
    ['connecting', 'Connecting'],
    ['listening', 'Listening'],
    ['thinking', 'Thinking'],
    ['speaking', 'Speaking'],
    ['error', 'Error'],
    ['disabled', 'Muted'],
  ] as const)('announces %s as %s', (state, text) => {
    render(<OrbStatus state={state} />);
    expect(screen.getByRole('status').textContent).toBe(text);
  });

  it('applies a custom className', () => {
    render(<OrbStatus state="idle" className="sr-only" />);
    expect(screen.getByRole('status').classList.contains('sr-only')).toBe(true);
  });
});
