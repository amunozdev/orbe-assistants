import { promises as fs } from 'fs';
import path from 'path';
import { orbs, SHARED_FILES } from '@/registry/registry';
import { buildAiPrompt, type FileWithCode } from '@/registry/prompt';
import { Gallery } from '@/components/gallery';
import { ThemeToggle } from '@/components/theme-toggle';
import type { OrbCardData } from '@/components/orb-card';

const read = async (file: { label: string; path: string; lang: string }): Promise<FileWithCode> => ({
  ...file,
  code: await fs.readFile(path.join(process.cwd(), file.path), 'utf8'),
});

const getOrbs = async (): Promise<OrbCardData[]> => {
  const shared = await Promise.all(SHARED_FILES.map(read));
  return Promise.all(
    orbs.map(async (orb) => {
      const files = await Promise.all(orb.files.map(read));
      return {
        id: orb.id,
        name: orb.name,
        tagline: orb.tagline,
        tech: orb.tech,
        dependencies: orb.dependencies,
        defaultColorFrom: orb.defaultColorFrom,
        defaultColorTo: orb.defaultColorTo,
        defaultSize: orb.defaultSize,
        files,
        aiPrompt: buildAiPrompt(orb.name, orb.dependencies, files, shared),
      };
    }),
  );
};

const Page = async () => {
  const data = await getOrbs();

  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <header className="mb-12 max-w-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted">
            Open source · copy-paste
          </p>
          <ThemeToggle />
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Animated orbs for AI Assistants
        </h1>
        <p className="mt-4 text-pretty text-base text-muted">
          A gallery of orbs with shared states —{' '}
          <span className="text-foreground">idle · connecting · listening · thinking · speaking</span> — ready to
          copy. Toggle states, try the mic reactivity and customize color, speed and size.
        </p>
      </header>

      <Gallery orbs={data} />
    </main>
  );
};

export default Page;
