# Orbe Assistants

An open-source, copy-paste gallery of animated, audio-reactive orbs for AI voice assistants.
Every orb is built around a shared state model and a small set of CSS custom properties, so you
can drop one into your own React / Next.js (App Router) project and wire it to your assistant's
lifecycle.

- Demo: [orbe-assistants.vercel.app](https://orbe-assistants.vercel.app)
- Repo: [github.com/amunozdev/orbe-assistants](https://github.com/amunozdev/orbe-assistants)

## Orbs

| Orb | Tech |
| --- | --- |
| **Pulse Orb**: core with expanding rings and a loading arc | Pure CSS |
| **Glass Orb**: iridescent glassmorphism with a spinning conic aura | Pure CSS |
| **Gooey Orb**: liquid blob whose edges boil with SVG noise | SVG filters |
| **Plasma Orb**: shader mesh gradient on canvas, no Three.js | Shader (canvas) |
| **Nebula Orb**: 3D sphere with simplex-noise displacement and fresnel | WebGL (R3F + GLSL) |

## Shared state model

Each orb takes the same props and reacts to a shared set of assistant states:

`idle · connecting · listening · thinking · speaking` (plus `error` and `disabled`).

Props: `state`, `size`, `speed`, `colorFrom`, `colorTo`, `levelRef`, `label`, `className`.
`levelRef` is a `RefObject<number>` carrying a live audio amplitude (0..1); a negative value
means "no live audio" and the orb falls back to a procedural animation. Customization also flows
through public CSS variables: `--orb-size`, `--orb-speed`, `--orb-color-from`, `--orb-color-to`,
`--orb-level`.

The gallery UI lets you toggle states, try mic reactivity and adjust color, speed and size live.

## Distribution

Two ways to take an orb into your project:

1. **Copy code**: each card exposes "View code" (one tab per file) and a "Copy code" button.
   Paste the files, add the shared utilities from `src/registry/lib/`
   (`orb-state.ts`, `use-orb-level.ts`, `use-audio-level.ts`) and install any listed dependencies.
2. **Copy AI prompt**: a per-orb button that copies a self-contained prompt (shared utilities +
   orb files + props/state contract) to paste into Cursor / Copilot / Claude Code so the assistant
   recreates the orb and adapts it to your project.

More details in [`docs/distribution.md`](docs/distribution.md).

## Development

```bash
pnpm dev     # start the dev server
pnpm build   # production build
pnpm lint    # run eslint
```

Orbs live in `src/registry/orbe/<orb>/`, the source of truth for both distribution paths.
