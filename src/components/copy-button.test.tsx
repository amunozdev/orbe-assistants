import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '@/components/copy-button';

const stubClipboard = (writeText: (text: string) => Promise<void>): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CopyButton', () => {
  it('renders the default label', () => {
    render(<CopyButton value="hello" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDefined();
  });

  it('renders a custom label', () => {
    render(<CopyButton value="hello" label="Copy AI prompt" />);
    expect(screen.getByRole('button', { name: 'Copy AI prompt' })).toBeDefined();
  });

  it('writes the value to the clipboard and announces Copied', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CopyButton value="npx create-orb" />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('npx create-orb');
    const status = await screen.findByRole('status');
    expect(status.textContent).toBe('✓ Copied');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('announces the failure when the clipboard write is rejected', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    stubClipboard(writeText);
    render(<CopyButton value="secret" />);
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText('Copy failed')).toBeDefined();
  });

  it('merges a custom className', () => {
    render(<CopyButton value="hello" className="w-full" />);
    expect(screen.getByRole('button').classList.contains('w-full')).toBe(true);
  });
});
