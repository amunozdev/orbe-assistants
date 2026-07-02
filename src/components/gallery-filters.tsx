'use client';

import clsx from 'clsx';

const FilterChip = ({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={active}
    className={clsx(
      'inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 text-xs transition-colors sm:min-h-0 sm:px-2.5 sm:py-1',
      active
        ? 'border-accent bg-accent/15 text-accent-foreground'
        : 'border-border text-muted hover:border-accent hover:text-foreground',
    )}
  >
    {label}
  </button>
);

export const GalleryFilters = ({
  query,
  onQueryChange,
  techOptions,
  activeTechs,
  onToggleTech,
  zeroDeps,
  onToggleZeroDeps,
  tailwind,
  onToggleTailwind,
  count,
  total,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  techOptions: string[];
  activeTechs: string[];
  onToggleTech: (tech: string) => void;
  zeroDeps: boolean;
  onToggleZeroDeps: () => void;
  tailwind: boolean;
  onToggleTailwind: () => void;
  count: number;
  total: number;
}) => (
  <div className="mb-8 flex flex-col gap-3">
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="orb-search" className="sr-only">
        Search orbs
      </label>
      <input
        id="orb-search"
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search orbs by name or tagline"
        className="w-full max-w-xs rounded-md border border-border bg-panel px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted focus:border-accent focus:outline-none sm:py-1.5"
      />
      <p role="status" className="text-xs text-muted">
        {count} of {total} orbs
      </p>
    </div>
    <div role="group" aria-label="Filter orbs" className="flex flex-wrap items-center gap-1.5">
      {techOptions.map((tech) => (
        <FilterChip
          key={tech}
          label={tech}
          active={activeTechs.includes(tech)}
          onToggle={() => onToggleTech(tech)}
        />
      ))}
      <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />
      <FilterChip label="Zero deps" active={zeroDeps} onToggle={onToggleZeroDeps} />
      <FilterChip label="Tailwind variant" active={tailwind} onToggle={onToggleTailwind} />
    </div>
  </div>
);
