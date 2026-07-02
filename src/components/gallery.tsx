'use client';

import { useMemo, useState } from 'react';
import type { AdapterFilesWithCode, FileWithCode } from '@/registry/prompt';
import { OrbCard, type OrbCardData } from './orb-card';
import { GalleryFilters } from './gallery-filters';

export const Gallery = ({
  orbs,
  shared,
  adapters,
}: {
  orbs: OrbCardData[];
  shared: FileWithCode[];
  adapters: AdapterFilesWithCode;
}) => {
  const [query, setQuery] = useState('');
  const [activeTechs, setActiveTechs] = useState<string[]>([]);
  const [zeroDeps, setZeroDeps] = useState(false);
  const [tailwind, setTailwind] = useState(false);

  const techOptions = useMemo(() => [...new Set(orbs.map((orb) => orb.tech))], [orbs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orbs.filter((orb) => {
      if (q && !orb.name.toLowerCase().includes(q) && !orb.tagline.toLowerCase().includes(q)) {
        return false;
      }
      if (activeTechs.length > 0 && !activeTechs.includes(orb.tech)) return false;
      if (zeroDeps && orb.dependencies.length > 0) return false;
      if (tailwind && !orb.files.some((file) => file.variant === 'tailwind')) return false;
      return true;
    });
  }, [orbs, query, activeTechs, zeroDeps, tailwind]);

  const toggleTech = (tech: string) =>
    setActiveTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );

  return (
    <section>
      <GalleryFilters
        query={query}
        onQueryChange={setQuery}
        techOptions={techOptions}
        activeTechs={activeTechs}
        onToggleTech={toggleTech}
        zeroDeps={zeroDeps}
        onToggleZeroDeps={() => setZeroDeps((prev) => !prev)}
        tailwind={tailwind}
        onToggleTailwind={() => setTailwind((prev) => !prev)}
        count={filtered.length}
        total={orbs.length}
      />
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-panel/60 p-10 text-center text-sm text-muted">
          No orbs match the current search and filters.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((orb) => (
            <OrbCard key={orb.id} orb={orb} shared={shared} adapters={adapters} />
          ))}
        </div>
      )}
    </section>
  );
};
