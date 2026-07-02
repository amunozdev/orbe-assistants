'use client';

import * as Tabs from '@radix-ui/react-tabs';
import { Highlight, themes } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import type { FileWithCode } from '@/registry/prompt';
import { CopyButton } from './copy-button';

interface CodeBlockProps {
  files: FileWithCode[];
}

const toPrismLanguage = (lang: string): Language => {
  if (lang === 'ts') return 'typescript';
  if (lang === 'css') return 'css';
  return 'tsx';
};

export const CodeBlock = ({ files }: CodeBlockProps) => (
  <Tabs.Root defaultValue={files[0]?.label} className="overflow-hidden rounded-lg border border-border bg-code">
    <Tabs.List className="flex flex-wrap gap-1 border-b border-code-border bg-code-tab px-2 py-1.5">
      {files.map((file) => (
        <Tabs.Trigger
          key={file.label}
          value={file.label}
          className="rounded-md px-2.5 py-1 text-xs text-code-muted transition-colors hover:text-code-foreground data-[state=active]:bg-code data-[state=active]:text-code-accent"
        >
          {file.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {files.map((file) => (
      <Tabs.Content key={file.label} value={file.label} className="relative">
        <div className="absolute right-2 top-2 z-10">
          <CopyButton value={file.code} label="Copy code" />
        </div>
        <Highlight theme={themes.vsDark} code={file.code} language={toPrismLanguage(file.lang)}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-code-foreground"
              style={{ background: 'transparent' }}
            >
              {tokens.map((line, lineIndex) => (
                <div key={lineIndex} {...getLineProps({ line })}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </Tabs.Content>
    ))}
  </Tabs.Root>
);
