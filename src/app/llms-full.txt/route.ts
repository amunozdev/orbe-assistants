import { orbs, ORB_PROPS } from '@/registry/registry';
import { ORB_STATES } from '@/registry/lib/orb-state';
import { readOrbFiles, readSharedFiles } from '@/registry/read-files';
import type { FileWithCode } from '@/registry/prompt';

export const dynamic = 'force-static';

const SITE_URL = 'https://orbe-assistants.vercel.app';
const REPO_URL = 'https://github.com/amunozdev/orbe-assistants';

const fileBlock = (file: FileWithCode): string => {
  const code = file.code.endsWith('\n') ? file.code : `${file.code}\n`;
  return `### ${file.label}\n\n\`\`\`${file.lang}\n${code}\`\`\`\n`;
};

export const GET = async (): Promise<Response> => {
  const shared = await readSharedFiles();
  const orbFiles = await Promise.all(orbs.map(readOrbFiles));

  const coreStates = ORB_STATES.join(', ');
  const propLines = ORB_PROPS.map(
    (p) => `- \`${p.name}\` (\`${p.type}\`, default: ${p.default}): ${p.description}`,
  ).join('\n');
  const indexLines = orbs
    .map((orb) => `- ${orb.name} (${orb.tech}): ${SITE_URL}/orbs/${orb.id}`)
    .join('\n');

  const orbSections = orbs
    .map((orb, i) => {
      const deps = orb.dependencies.length
        ? `\`${orb.dependencies.join('`, `')}\``
        : 'none';
      return `## ${orb.name}

- Page: ${SITE_URL}/orbs/${orb.id}
- Tech: ${orb.tech}
- Dependencies: ${deps}
- ${orb.tagline}

${orbFiles[i].map(fileBlock).join('\n')}`;
    })
    .join('\n');

  const body = `# Orbe Assistants (full source)

> Animated, audio-reactive orbs for AI voice assistants: ${orbs.length} copy-paste React components sharing one small props contract, distributed as source code and AI prompts instead of an npm package.

This file contains the complete source of every orb, followed by the shared library (copy it once) and a short integration guide. Gallery: ${SITE_URL} - Repository: ${REPO_URL}

## Props contract

All orbs accept the same props (\`OrbProps\` in \`src/registry/lib/orb-state.ts\`):

${propLines}

States: ${coreStates} form the core lifecycle; \`error\` and \`disabled\` are optional extensions implemented by every orb. Each orb also exposes the CSS variables \`--orb-size\`, \`--orb-speed\`, \`--orb-color-from\`, \`--orb-color-to\` and \`--orb-level\` for theming and animation from CSS.

## Index

${indexLines}

${orbSections}
## Shared library

Copy these files once (path: \`src/registry/lib\`); every orb imports from them.

${shared.map(fileBlock).join('\n')}
## Integration guide

- Orbs are client components ("use client") for React / Next.js App Router. Keep the file paths shown above; if the project has no \`src/\` directory, place them under \`registry/\` at the project root and adjust the import paths.
- Wiring: drive \`state\` from your assistant lifecycle and pass a \`levelRef\` from the bundled \`use-audio-level\` hook (mic input while listening; attach an AnalyserNode to the TTS output while speaking):

\`\`\`tsx
'use client';
import { useState } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';

export const AssistantOrb = () => {
  const [state, setState] = useState<OrbState>('idle');
  const { levelRef } = useAudioLevel(state === 'listening');
  return <PulseOrb state={state} levelRef={levelRef} />;
};
\`\`\`

- \`levelRef.current\` is a live 0..1 amplitude read every frame without re-render; set it to a negative value to fall back to the procedural animation.
- For smooth per-frame transitions, \`orb-state.ts\` exports \`approach()\` (exponential easing toward a target) and \`createStateMix()\` (blends state weights over time).
- Accessibility: render the shared \`<OrbStatus state={state} />\` (\`lib/orb-status.tsx\`) near the orb so state changes are announced via a polite live region, and never signal the error state by color alone. Respect \`prefers-reduced-motion\`.
- Provider wiring: the "Copy AI prompt" button on each orb page (${SITE_URL}/orbs/<id>) offers ready-made integration notes for Vapi, ElevenLabs Agents, LiveKit Agents and OpenAI Realtime (WebRTC), mapping each SDK's lifecycle events to \`state\` and its volume APIs to \`levelRef\`.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
