---
name: orbe-design-system
description: Author and review UI for the Orbe Assistants design system. Use when adding or styling a component, picking colors/spacing/typography, adding or editing a theme (dark/light), building a new orb, or reviewing UI against the Orbe tokens — e.g. "make it on-brand", "on-system", "review my UI", "add a component", "style this".
metadata:
  author: orbe-assistants
  version: "0.1.0"
  argument-hint: <file-or-pattern | component-name>
---

# Orbe Assistants — Design System

Dual-purpose skill: **author** on-system UI and **review** existing UI against the tokens below. Orbe Assistants is an open-source gallery of animated, audio-reactive orbs for AI voice assistants, distributed via a shadcn registry. Stack: Next.js 16 (App Router, RSC), React 19, Tailwind CSS v4 (CSS-first, no `tailwind.config.js`), TypeScript strict.

Source of truth for tokens: `src/app/globals.css`. When tokens change there, update this skill.

## When to use
- Adding/styling a component, an orb, or a page.
- Choosing color, spacing, typography, radii, motion.
- Adding or adjusting the dark/light theme.
- Reviewing UI for on-system + accessibility compliance.

## How to use (procedure)
1. **Author or review** the target file(s). For review, if no file/pattern was given, ask which.
2. Check every rule below. For general web-interface/accessibility rules beyond this system, defer to the Vercel Web Interface Guidelines: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` (WebFetch fresh when doing an accessibility audit).
3. Output findings terse, grouped by file, one issue per line: `file:line - issue → fix`. Add on-system checks: `raw hex in component → use --color-* token`, `primitive referenced in component → use semantic token`, `animated width/height/box-shadow → animate transform/opacity`, `continuous animation without prefers-reduced-motion guard`.

## Core rule
**Components reference semantic tokens only** (Tailwind theme utilities `bg-background`, `text-foreground`, `border-border`, `text-muted`, `bg-panel`, `text-accent`, or `var(--color-*)`). Never hardcode hex in component markup. Orb color inputs (`colorFrom`/`colorTo`) are the deliberate exception — they are user-facing props flowed through `orbVars()`.

## Token architecture
Target model is 3-tier (primitive → semantic → component). Today the repo is **one-tier**: the semantic names hold raw values directly and there is **no primitive layer**. When adding light mode, keep semantic names stable and only remap their values per theme (see Theming). Component-scoped tokens already exist for orbs: `--orb-size`, `--orb-speed`, `--orb-color-from`, `--orb-color-to`, `--orb-level`.

Mechanism: values live as CSS custom properties in `:root` / `.dark`; `@theme inline` in `globals.css` exposes them to Tailwind as `--color-*` so utilities resolve `var(--…)` live and flip with the theme class — do not bake hex into `@theme`.

## Color & surfaces (current = dark)
| Token | Dark value | Role |
| --- | --- | --- |
| `--background` | `#06070d` | Base app background |
| `--panel` | `#0e1019` | Elevated surface / cards (lighter than bg = elevation) |
| `--border` | `#1d2030` | Borders / dividers |
| `--foreground` | `#e7e9f3` | Primary text |
| `--muted` | `#8b8fa3` | Secondary/disabled text |
| `--accent` | `#6366f1` | Indigo-500 — interactive fills, selected state |

Surface ladder: `--background` → `bg-panel/60` (translucent elevated) → radial-gradient preview wells. Prefer **tonal elevation + subtle border** over heavy drop shadows in dark mode.

Contrast targets (WCAG 2.2): body text ≥ 4.5:1, large text / UI boundaries / focus ≥ 3:1. Current dark pairs pass (fg/bg 16.6:1, muted/bg 6.3:1). Verify every state in **both** themes.

## Theming (dark + light)
Light mode ships via `next-themes` (`attribute="class"`, `defaultTheme="system"`). Tailwind v4 needs an explicit class variant declared right after the import:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Pattern: **light values in `:root`** (no class present = light), **dark overrides in `.dark`**, same semantic names, exposed once via `@theme inline`. Set `color-scheme` per theme and keep `<meta name="theme-color">` in sync. `<html>` needs `suppressHydrationWarning`.

Verified light palette (WCAG AA+):
| Token | Light value | Notes |
| --- | --- | --- |
| `--background` | `#f7f8fc` | Subtle off-white base |
| `--panel` | `#ffffff` | Elevated card (whiter than bg — elevation inverts vs dark) |
| `--border` | `#e3e5ef` | Decorative divider |
| `--foreground` | `#12141f` | 17.3:1 on bg |
| `--muted` | `#565a6e` | 6.4:1 on bg |
| `--accent` | `#6366f1` | Same in both — for **fills** (white text on it = 4.47:1, AA large/UI) |
| `--accent-foreground` | light `#4f46e5` / dark `#a5b4fc` | New token for **link text**: `#6366f1` as text on light = 4.21:1 (fails AA), so use indigo-600 in light, indigo-300 in dark |

Rule: accent as a **fill** with white text is fine both themes; accent as **text** must use `--accent-foreground`.

## Typography
Geist Sans (UI) via `--font-sans`, Geist Mono (code, install commands) via `--font-mono`, both from `next/font/google`. Scale in use: page headings `text-4xl`/`text-5xl`, card headers `text-lg`, body/taglines `text-sm`, meta `text-xs`/`text-[11px]`. Use `tabular-nums` for numeric columns (e.g. star counts), `text-wrap: balance` on headings, `line-height` 1.4–1.6 for body. UI copy is English (see i18n note); code/commands stay English.

## Spacing, radii, layout
Tailwind v4 default 4px scale. Card grammar: `gap-4`, `p-5`, `rounded-2xl border border-border bg-panel/60`. Radii ramp: `rounded-md` controls, `rounded-xl` previews, `rounded-2xl` cards, `rounded-full` pills. Use flex/grid; `min-w-0` on flex children that truncate.

## Motion & the orb animation contract
Public protocol every orb honors: `--orb-speed` (animation multiplier), `--orb-level` (0..1 audio/energy, smoothed in `use-orb-level.ts`), `--orb-color-from/to`, `--orb-size`. Keyframe tokens: `orb-ring`, `orb-spin`, `orb-breathe` (all speed-scaled). Rules:
- Animate only `transform`/`opacity` and CSS custom properties. Never `transition: all`, never animate `width/height/top/left/box-shadow`.
- **Always** guard continuous motion with `prefers-reduced-motion: reduce` (drop to static/minimal). `use-orb-level.ts` already does; new orbs must too.
- One `requestAnimationFrame` per orb; write CSS vars, never read layout in the loop; reuse audio buffers; consider `IntersectionObserver` to pause offscreen.

## Component states matrix
Standard interactive axis: rest · hover · active · focus-visible · disabled · selected · loading · error — each must increase contrast progressively and pass WCAG in both themes. Canonical recipes:
- Selected pill: `border-accent bg-accent/15 text-accent`.
- Idle pill / link: `border-border text-muted hover:text-foreground`.
- Focus: visible `focus-visible:ring-*`; never bare `outline: none`.

Voice-runtime axis (unique to this project, in `src/registry/lib/orb-state.ts`): `idle · connecting · listening · thinking · speaking · error · disabled`. Distinguish states by **energy + motion kind + color/temperature**, not amplitude alone: listening = mic-reactive/cool, speaking = TTS-reactive/warm, thinking = autonomous shimmer (no audio peaks), error = brief non-flashing shake + icon (never color-only), disabled = desaturated static. Expose runtime state to assistive tech via a shared `role="status"` live region — the orb itself is `aria-hidden` decoration.

## Component authoring conventions
Named-export arrow components; Server Components by default, `'use client'` only on the minimal interactive leaf (WebGL/canvas orbs must be client-only — `next/dynamic({ ssr: false })` or a mount guard; never touch `window`/WebGL in server render). `clsx` for classes, kebab-case files, `@/*` alias, `import type` for types, no comments/`.md` unless asked. New orbs live in `src/registry/orbe/<id>/`, implement `OrbProps`, and register in `registry.json` (drives shadcn CLI install + Open in v0). Expose a `ref` on the root node (React 19: `ref` is a normal prop, no `forwardRef`).

## Review output format
```
## src/components/orb-card.tsx
src/components/orb-card.tsx:120 - raw hex #6366f1 in markup → use text-accent / var(--color-accent)
src/components/orb-card.tsx:88 - color input lacks aria-label → add aria-label
✓ src/components/gallery.tsx
```

## References
- Tokens: `src/app/globals.css` · Orb state: `src/registry/lib/orb-state.ts` · Level hook: `src/registry/lib/use-orb-level.ts`
- Vercel Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- Radix Colors 12-step scale, EightShapes token naming, WCAG 2.2 contrast (see Obsidian research notes for the full source list).
