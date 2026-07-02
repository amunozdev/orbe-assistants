# Contributing to Orbe Assistants

Thanks for your interest in contributing! Orbe Assistants is an open-source, copy-paste gallery of animated orbs for conversational AI assistants. Contributions of all sizes are welcome: new orbs, bug fixes, docs, and accessibility improvements.

> Code, commit messages, and pull requests are written in **English**.

## Getting started

Requirements:

- **Node.js** 20 or newer
- **pnpm** 10 or newer (`corepack enable` will provide the pinned version)

Set up the project:

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

Useful scripts:

```bash
pnpm lint    # ESLint
pnpm build   # Production build
```

## Pull request flow

1. **Fork** the repository and clone your fork.
2. Create a **branch** from `main` (for example `feat/my-new-orb` or `fix/footer-contrast`).
3. Make your changes following the standards below.
4. Use **[Conventional Commits](https://www.conventionalcommits.org/)** for commit messages (e.g. `feat: add nebula orb`, `fix: correct footer contrast in light mode`).
5. Ensure `pnpm lint` and `pnpm build` are **green**.
6. Open a **pull request against `main`** with a clear description of what and why.

## Standards

- **TypeScript strict** mode everywhere.
- **Named exports** only (no default exports outside Next.js pages/config).
- `const` arrow functions for components; Server Components by default, add `"use client"` only when necessary.
- **kebab-case** file names; `import type` for type-only imports.
- Use the design tokens (`text-foreground`, `text-muted`, `border-border`, `text-accent-foreground`) and make sure UI works in **both dark and light themes**.
- Keep `pnpm lint` and `pnpm build` passing before you push.

## Issues

New here? Look for issues labeled **`good first issue`**; they are scoped to be approachable. Feel free to open an issue first to discuss larger changes before writing code.

## Environment variables

An optional `GITHUB_TOKEN` can be set (see `.env.example`) to raise GitHub API rate limits for the live star count. It is not required for local development.
