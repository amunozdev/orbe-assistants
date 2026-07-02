# Voice assistant example

A minimal, standalone Vite + React 19 app showing how an Orbe Assistants orb plugs into a real voice assistant lifecycle: connect, listen to the microphone, detect silence, "think", "speak", and handle a denied microphone.

## Run it

```bash
cd examples/voice-assistant
pnpm install --ignore-workspace
pnpm dev
```

The `--ignore-workspace` flag keeps the example fully standalone (the repo root contains a `pnpm-workspace.yaml`, and this app is intentionally not part of that workspace). With npm or yarn a plain `install` works as is.

`pnpm build` type-checks (TypeScript strict) and produces a production bundle.

## What it demonstrates

- **PulseOrb** front and center, driven only by the public `OrbProps` contract.
- **Connect** simulates the session lifecycle: `connecting` then `listening`.
- While `listening`, the copied `useAudioLevel` hook captures your microphone and writes a normalized 0..1 level into `levelRef`. The orb reads it every frame, no re-renders involved.
- When you stop talking (a short silence timeout), the app moves to `thinking`, then plays a fake assistant reply in `speaking`. There is no live level during `speaking` (`levelRef.current` is `-1`), so the orb falls back to its procedural, state-driven animation, exactly what happens in production while your TTS plays if you do not analyse the output stream.
- **OrbStatus** under the orb announces every state change to screen readers (`role="status"`, `aria-live="polite"`).
- If microphone permission is denied (or the mic never delivers), the app switches to the `error` state and the orb recolors accordingly.

## How the wiring maps to the OrbProps contract

| Contract piece | Where it happens here |
| --- | --- |
| `state: OrbState` | `useState<OrbState>` in `src/app.tsx`, advanced by timers (connect, think, speak) and by the silence detector |
| `levelRef: RefObject<number>` | Returned by `useAudioLevel(micActive)`; passed straight to `<PulseOrb levelRef={...} />` |
| `levelRef.current < 0` | Means "no live audio", the orb animates procedurally from `state` alone |
| `error` from `useAudioLevel` | Mapped to `state="error"` |
| `size`, `label` | Plain props on `<PulseOrb />` |

Replace the timers with your real assistant events (Vapi, ElevenLabs, LiveKit, OpenAI Realtime callbacks) and the wiring stays identical: derive one `OrbState` plus one `levelRef` and pass them to any orb in the gallery.

## About `src/registry/`

Everything under `src/registry/` is a **verbatim copy** of the files distributed by the main repo's copy-code button (`src/registry/orbe/pulse-orb/` and `src/registry/lib/` in the main repo): `pulse-orb.tsx`, `pulse-orb.module.css`, `orb-state.ts`, `use-orb-level.ts`, `use-audio-level.ts`, `use-in-view.ts`, and `orb-status.tsx`. Nothing was edited, which is the point: the copied code runs unchanged outside Next.js (the `'use client'` directives are inert under Vite).
