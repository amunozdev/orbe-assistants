import type { Metadata } from 'next';
import Link from 'next/link';
import { RecipeCard } from './recipe-card';
import { recipes } from './recipes';

export const metadata: Metadata = {
  title: 'Recipes | Orbe Assistants',
  description:
    'Integration recipes for wiring Orbe Assistants orbs to real voice stacks: plain microphone, Vapi, ElevenLabs Agents, LiveKit Agents and OpenAI Realtime.',
};

const RecipesPage = () => (
  <main className="mx-auto max-w-5xl px-5 py-16">
    <header className="mb-12 max-w-2xl">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-muted transition-colors hover:text-accent-foreground"
      >
        &larr; Back to the gallery
      </Link>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
        Integration recipes
      </h1>
      <p className="mt-4 text-pretty text-base text-muted">
        Every orb takes the same two inputs: <span className="text-foreground">state</span> (the
        assistant lifecycle) and <span className="text-foreground">levelRef</span> (a live 0..1
        audio amplitude). These recipes show how to feed both from real voice stacks using the
        typed copy-paste adapters in{' '}
        <code className="rounded bg-code px-1.5 py-0.5 font-mono text-sm text-code-foreground">
          src/registry/lib
        </code>
        . The adapters type each provider surface structurally, so nothing here adds an SDK
        dependency to your bundle until you install the one you actually use.
      </p>
    </header>

    <div className="flex flex-col gap-10">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  </main>
);

export default RecipesPage;
