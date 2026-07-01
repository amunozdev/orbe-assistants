import { promises as fs } from 'fs';
import path from 'path';
import { orbs, SHARED_FILES } from '@/registry/registry';
import { buildAiPrompt, type FileWithCode } from '@/registry/prompt';
import { Gallery } from '@/components/gallery';
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
        <p className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-xs text-muted">
          Open source · copy-paste
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Orbes animados para AI Assistants
        </h1>
        <p className="mt-4 text-pretty text-base text-muted">
          Una galería de orbes con estados compartidos —{' '}
          <span className="text-foreground">idle · connecting · listening · thinking · speaking</span> — listos para
          copiar. Alterna estados, prueba la reactividad al micrófono y customiza color, velocidad y tamaño.
        </p>
      </header>

      <Gallery orbs={data} />

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted">
        ¿Cómo llevarte un orbe? Cada tarjeta trae el código completo (<span className="font-mono text-foreground">Ver código</span>{' '}
        + Copiar) y un <span className="font-mono text-foreground">prompt para IA</span>. Más detalles en{' '}
        <span className="font-mono text-foreground">docs/distribution.md</span>.
      </footer>
    </main>
  );
};

export default Page;
