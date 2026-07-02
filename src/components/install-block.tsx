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
    <Tabs.Root
      defaultValue="npm"
      className="overflow-hidden rounded-lg border border-border bg-panel"
    >
      <Tabs.List
        aria-label="Package manager"
        className="flex flex-wrap gap-1 border-b border-border bg-background/60 px-2 py-1.5"
      >
        {PACKAGE_MANAGERS.map((pm) => (
          <Tabs.Trigger
            key={pm.id}
            value={pm.id}
            className="rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground data-[state=active]:bg-accent/15 data-[state=active]:text-accent-foreground"
          >
            {pm.id}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {PACKAGE_MANAGERS.map((pm) => {
        const command = `${pm.run} ${dependencies.join(' ')}`;
        return (
          <Tabs.Content
            key={pm.id}
            value={pm.id}
            className="flex items-center gap-2 py-2 pr-2 pl-4"
          >
            <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-foreground">
              <span className="select-none text-muted">$ </span>
              {command}
            </pre>
            <CopyButton value={command} label="Copy" className="shrink-0" />
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
};
