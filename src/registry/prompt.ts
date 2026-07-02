import type { OrbFile } from './registry';
import { ORB_STATES } from './lib/orb-state';
import type { OrbState } from './lib/orb-state';

export interface FileWithCode extends OrbFile {
  code: string;
}

const OPTIONAL_STATES = ['error', 'disabled'] as const satisfies readonly OrbState[];

const stateUnion = (states: readonly OrbState[]): string =>
  states.map((s) => `'${s}'`).join(' | ');

export const buildAiPrompt = (
  name: string,
  dependencies: string[],
  files: FileWithCode[],
  shared: FileWithCode[],
): string => {
  const deps = dependencies.length
    ? `First install: \`${dependencies.join(' ')}\`.`
    : 'No extra dependencies are required.';
  const block = (f: FileWithCode) => `\n${f.label}\n\`\`\`${f.lang}\n${f.code}\`\`\`\n`;
  const component = name.replace(/\s+/g, '');
  const componentPath = files[0]
    ? files[0].path.replace(/^src\//, '').replace(/\.tsx?$/, '')
    : 'registry/orbe';

  return `Integrate the "${name}" animated AI-assistant orb into my React / Next.js (App Router) project.

${deps}

Create these shared utilities once (path: src/registry/lib):
${shared.map(block).join('')}
Create the component files:
${files.map(block).join('')}
Notes:
- It is a client component ("use client"). Keep the file paths shown above; if the project has no src/ directory, place them under registry/ at the project root and adjust the import paths accordingly.
- Props: state (${stateUnion(ORB_STATES)}; plus the optional extensions ${stateUnion(OPTIONAL_STATES)}), size (px), speed (multiplier), colorFrom, colorTo, levelRef (RefObject<number>; 0..1 live audio amplitude, a negative value means "no live audio" and the orb falls back to a procedural animation), label, className.
- Theming: the orb reads the CSS variables --orb-size, --orb-speed, --orb-color-from, --orb-color-to and --orb-level, so it can also be themed or animated from CSS.
- Minimal wiring: drive state from the assistant lifecycle and pass a levelRef from the bundled use-audio-level hook (mic while listening; use TTS output while speaking):
\`\`\`tsx
'use client';
import { useState } from 'react';
import type { OrbState } from '@/registry/lib/orb-state';
import { useAudioLevel } from '@/registry/lib/use-audio-level';
import { ${component} } from '@/${componentPath}';

export const AssistantOrb = () => {
  const [state, setState] = useState<OrbState>('idle');
  const levelRef = useAudioLevel(state === 'listening');
  return <${component} state={state} levelRef={levelRef} />;
};
\`\`\`
- For smooth per-frame transitions between states, orb-state.ts also exports the helpers approach() (exponential easing toward a target) and createStateMix() (blends state weights over time).
- Respect \`prefers-reduced-motion\`.`;
};
