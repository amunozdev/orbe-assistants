import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { orbs } from '@/registry/registry';
import { readAdapterFiles, readOrbFiles, readSharedFiles } from '@/registry/read-files';
import { buildUsageSnippet } from '@/registry/prompt';
import { OrbCard, type OrbCardData } from '@/components/orb-card';
import { CopyButton } from '@/components/copy-button';
import { PropsTable } from './props-table';

export const dynamicParams = false;

export const generateStaticParams = () => orbs.map(({ id }) => ({ id }));

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const orb = orbs.find((o) => o.id === id);
  if (!orb) return {};
  const title = `${orb.name} | Orbe Assistants`;
  return {
    title,
    description: orb.tagline,
    alternates: { canonical: `/orbs/${orb.id}` },
    openGraph: {
      title,
      description: orb.tagline,
      url: `/orbs/${orb.id}`,
      siteName: 'Orbe Assistants',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: orb.tagline,
    },
  };
};

const CodePane = ({ code }: { code: string }) => (
  <div className="relative rounded-lg border border-border bg-code">
    <div className="absolute right-2 top-2 z-10">
      <CopyButton value={code} label="Copy" />
    </div>
    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-code-foreground">
      {code}
    </pre>
  </div>
);

const wireSnippet = (component: string, id: string) => `'use client';
import { useState } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { ${component} } from '@/registry/orbe/${id}/${id}';

export const Assistant = () => {
  const [state, setState] = useState<OrbState>('idle');
  const { levelRef } = useAudioLevel(state === 'listening');

  return <${component} state={state} levelRef={levelRef} />;
};
`;

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const index = orbs.findIndex((o) => o.id === id);
  if (index === -1) notFound();

  const orb = orbs[index];
  const prev = orbs[(index - 1 + orbs.length) % orbs.length];
  const next = orbs[(index + 1) % orbs.length];
  const [files, shared, adapters] = await Promise.all([
    readOrbFiles(orb),
    readSharedFiles(),
    readAdapterFiles(),
  ]);

  const data: OrbCardData = {
    id: orb.id,
    name: orb.name,
    tagline: orb.tagline,
    tech: orb.tech,
    dependencies: orb.dependencies,
    defaultColorFrom: orb.defaultColorFrom,
    defaultColorTo: orb.defaultColorTo,
    defaultSize: orb.defaultSize,
    files,
  };

  const component = orb.name.replace(/\s+/g, '');
  const usage = buildUsageSnippet(component, {
    state: 'idle',
    size: orb.defaultSize,
    speed: 1,
    colorFrom: orb.defaultColorFrom,
    colorTo: orb.defaultColorTo,
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-3 text-sm text-muted">
        <Link href="/" className="transition-colors hover:text-accent-foreground">
          ← All orbs
        </Link>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <Link href={`/#${orb.id}`} className="transition-colors hover:text-accent-foreground">
          View in gallery
        </Link>
      </nav>

      <header className="mb-10 max-w-2xl">
        <p className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-xs text-muted">
          {orb.tech}
          {orb.dependencies.length === 0 ? ' · zero deps' : ''}
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">{orb.name}</h1>
        <p className="mt-4 text-pretty text-base text-muted">{orb.tagline}</p>
      </header>

      <section aria-label="Playground" className="mb-14">
        <OrbCard orb={data} shared={shared} adapters={adapters} hideDetailsLink />
      </section>

      <section className="mb-14">
        <h2 className="mb-4 text-xl font-semibold">Props</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Every orb implements the same contract, so they are interchangeable: swap the import and
          keep the props.
        </p>
        <PropsTable />
      </section>

      <section className="mb-14">
        <h2 className="mb-4 text-xl font-semibold">Usage</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Copy the component files from the playground above, then render the orb with its default
          configuration.
          {orb.dependencies.length > 0 && (
            <>
              {' '}
              First install{' '}
              <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-xs text-foreground">
                {orb.dependencies.join(' ')}
              </code>
              .
            </>
          )}
        </p>
        <CodePane code={usage} />
      </section>

      <section className="mb-14">
        <h2 className="mb-4 text-xl font-semibold">Wire it to audio</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Drive <code className="font-mono text-xs text-foreground">state</code> from your assistant
          lifecycle and pass a{' '}
          <code className="font-mono text-xs text-foreground">levelRef</code> with the live
          amplitude. The bundled{' '}
          <code className="font-mono text-xs text-foreground">useAudioLevel</code> hook opens the
          microphone and writes a 0..1 level into the ref every frame without re-rendering; while
          the value is negative the orb falls back to its procedural animation.
        </p>
        <CodePane code={wireSnippet(component, orb.id)} />
      </section>

      <nav aria-label="Orb navigation" className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
        <Link
          href={`/orbs/${prev.id}`}
          className="group rounded-2xl border border-border bg-panel/60 p-5 transition-colors hover:border-accent"
        >
          <span className="text-xs text-muted">← Previous</span>
          <span className="mt-1 block font-semibold text-foreground transition-colors group-hover:text-accent-foreground">
            {prev.name}
          </span>
        </Link>
        <Link
          href={`/orbs/${next.id}`}
          className="group rounded-2xl border border-border bg-panel/60 p-5 text-right transition-colors hover:border-accent"
        >
          <span className="text-xs text-muted">Next →</span>
          <span className="mt-1 block font-semibold text-foreground transition-colors group-hover:text-accent-foreground">
            {next.name}
          </span>
        </Link>
      </nav>
    </main>
  );
};

export default Page;
