import Link from 'next/link';
import { GitHubStars } from '@/components/github-stars';
import { ThemeToggle } from '@/components/theme-toggle';

export const Header = () => (
  <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
      <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
        <span
          aria-hidden
          className="size-5 rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-foreground))]"
        />
        Orbe Assistants
      </Link>
      <div className="flex items-center gap-2.5">
        <Link
          href="/recipes"
          className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          Recipes
        </Link>
        <GitHubStars />
        <ThemeToggle />
      </div>
    </div>
  </header>
);
