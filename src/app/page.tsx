import { orbs } from '@/registry/registry';
import { readAdapterFiles, readOrbFiles, readSharedFiles } from '@/registry/read-files';
import { Gallery } from '@/components/gallery';
import type { OrbCardData } from '@/components/orb-card';

const getOrbs = (): Promise<OrbCardData[]> =>
  Promise.all(
    orbs.map(async (orb) => ({
      id: orb.id,
      name: orb.name,
      tagline: orb.tagline,
      tech: orb.tech,
      dependencies: orb.dependencies,
      defaultColorFrom: orb.defaultColorFrom,
      defaultColorTo: orb.defaultColorTo,
      defaultSize: orb.defaultSize,
      files: await readOrbFiles(orb),
    })),
  );

const Page = async () => {
  const [data, shared, adapters] = await Promise.all([
    getOrbs(),
    readSharedFiles(),
    readAdapterFiles(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-16">
      <header className="mb-8 max-w-2xl sm:mb-12">
        <p className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-xs text-muted">
          Open source · copy-paste
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Animated orbs for AI Assistants
        </h1>
        <p className="mt-4 text-pretty text-sm text-muted sm:text-base">
          A gallery of orbs with shared states:{' '}
          <span className="text-foreground">idle · connecting · listening · thinking · speaking</span>, ready to
          copy. Toggle states, try the mic reactivity and customize color, speed and size.
        </p>
      </header>

      <Gallery orbs={data} shared={shared} adapters={adapters} />
    </main>
  );
};

export default Page;
