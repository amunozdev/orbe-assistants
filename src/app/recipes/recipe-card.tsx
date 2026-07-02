import { CopyButton } from '@/components/copy-button';
import type { Recipe } from './recipes';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard = ({ recipe }: RecipeCardProps) => (
  <article
    id={recipe.id}
    className="scroll-mt-20 overflow-hidden rounded-xl border border-border bg-panel"
  >
    <div className="flex flex-col gap-2.5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">{recipe.name}</h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted">
          {recipe.badge}
        </span>
      </div>
      <p className="max-w-3xl text-sm leading-relaxed text-muted">{recipe.intro}</p>
      {recipe.adapterPath ? (
        <p className="text-xs text-muted">
          Copy the adapter from{' '}
          <code className="rounded bg-code px-1.5 py-0.5 font-mono text-code-foreground">
            {recipe.adapterPath}
          </code>{' '}
          into your project first.
        </p>
      ) : null}
    </div>
    <div className="relative border-t border-code-border bg-code">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton value={recipe.code} label="Copy recipe" />
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed text-code-foreground">
        {recipe.code}
      </pre>
    </div>
  </article>
);
