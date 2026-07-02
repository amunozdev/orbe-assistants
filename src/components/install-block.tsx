'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { CopyButton } from './copy-button';

const PACKAGE_MANAGERS = [
  { id: 'npm', run: 'npm i' },
  { id: 'pnpm', run: 'pnpm add' },
  { id: 'yarn', run: 'yarn add' },
  { id: 'bun', run: 'bun add' },
] as const;

export const InstallBlock = ({ dependencies }: { dependencies: string[] }) => {
  if (dependencies.length === 0) return null;
  return (
    <Tabs.Root defaultValue="npm" className="flex flex-wrap items-center gap-2">
      <Tabs.List
        aria-label="Package manager"
        className="flex items-center gap-0.5 rounded-md border border-border bg-panel p-0.5"
      >
        {PACKAGE_MANAGERS.map((pm) => (
          <Tabs.Trigger
            key={pm.id}
            value={pm.id}
            className="rounded px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-foreground data-[state=active]:bg-accent/15 data-[state=active]:text-accent-foreground"
          >
            {pm.id}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {PACKAGE_MANAGERS.map((pm) => {
        const command = `${pm.run} ${dependencies.join(' ')}`;
        return (
          <Tabs.Content key={pm.id} value={pm.id} className="flex min-w-0 items-center gap-2">
            <code className="truncate font-mono text-[11px] text-muted">{command}</code>
            <CopyButton value={command} label="Copy" />
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
};
