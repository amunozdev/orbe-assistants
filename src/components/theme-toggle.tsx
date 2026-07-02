'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

const BASE_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-panel text-sm text-foreground transition-colors hover:border-accent hover:text-accent-foreground';

const emptySubscribe = () => () => {};

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <button type="button" aria-label="Toggle theme" className={BASE_CLASS}>
        <span aria-hidden>☀</span>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Theme: ${isDark ? 'Dark' : 'Light'}. Click to switch theme`}
      title={`Theme: ${isDark ? 'Dark' : 'Light'}`}
      className={BASE_CLASS}
    >
      <span aria-hidden>{isDark ? '☾' : '☀'}</span>
    </button>
  );
};
