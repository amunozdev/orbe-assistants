'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

export const CopyButton = ({ value, label = 'Copy', className }: CopyButtonProps) => {
  const [status, setStatus] = useState<CopyStatus>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.setTimeout(() => setStatus('idle'), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={clsx(
        'rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground',
        className,
      )}
    >
      {status === 'idle' && label}
      <span role="status" aria-live="polite">
        {status === 'copied' ? '✓ Copied' : status === 'failed' ? 'Copy failed' : null}
      </span>
    </button>
  );
};
