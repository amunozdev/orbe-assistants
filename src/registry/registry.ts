export interface OrbFile {
  label: string;
  path: string;
  lang: string;
  variant?: 'css-modules' | 'tailwind';
}

export interface OrbMeta {
  id: string;
  name: string;
  tagline: string;
  tech: string;
  dependencies: string[];
  defaultColorFrom: string;
  defaultColorTo: string;
  defaultSize: number;
  files: OrbFile[];
}

const SHARED_FILES: OrbFile[] = [
  { label: 'lib/orb-state.ts', path: 'src/registry/lib/orb-state.ts', lang: 'ts' },
  { label: 'lib/use-orb-level.ts', path: 'src/registry/lib/use-orb-level.ts', lang: 'ts' },
  { label: 'lib/use-audio-level.ts', path: 'src/registry/lib/use-audio-level.ts', lang: 'ts' },
  { label: 'lib/use-in-view.ts', path: 'src/registry/lib/use-in-view.ts', lang: 'ts' },
  { label: 'lib/use-webgl-support.ts', path: 'src/registry/lib/use-webgl-support.ts', lang: 'ts' },
  { label: 'lib/use-audio-bands.ts', path: 'src/registry/lib/use-audio-bands.ts', lang: 'ts' },
  { label: 'lib/use-waveform.ts', path: 'src/registry/lib/use-waveform.ts', lang: 'ts' },
  { label: 'lib/use-orb-cues.ts', path: 'src/registry/lib/use-orb-cues.ts', lang: 'ts' },
];

export { SHARED_FILES };

export interface OrbPropMeta {
  name: string;
  type: string;
  default: string;
  description: string;
}

export const ORB_PROPS: OrbPropMeta[] = [
  {
    name: 'state',
    type: "'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error' | 'disabled'",
    default: "'idle'",
    description: 'Assistant lifecycle state driving the animation. error and disabled are optional extensions.',
  },
  {
    name: 'size',
    type: 'number',
    default: '160-184 (per orb)',
    description: 'Diameter of the orb in pixels, also exposed as the --orb-size CSS variable.',
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Animation speed multiplier, also exposed as the --orb-speed CSS variable.',
  },
  {
    name: 'colorFrom',
    type: 'string',
    default: 'per-orb gradient start',
    description: 'Gradient start color (any CSS color), exposed as --orb-color-from.',
  },
  {
    name: 'colorTo',
    type: 'string',
    default: 'per-orb gradient end',
    description: 'Gradient end color (any CSS color), exposed as --orb-color-to.',
  },
  {
    name: 'levelRef',
    type: 'RefObject<number>',
    default: 'undefined',
    description: 'Live audio amplitude in 0..1 read every frame without re-render; a negative value falls back to the procedural animation.',
  },
  {
    name: 'label',
    type: 'string',
    default: "'Assistant orb'",
    description: 'Accessible name announced by screen readers via aria-label.',
  },
  {
    name: 'className',
    type: 'string',
    default: 'undefined',
    description: 'Extra class names merged onto the root element.',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLDivElement>',
    default: 'undefined',
    description: 'React 19 ref to the root element for measuring, animating or scrolling into view.',
  },
];

export const orbs: OrbMeta[] = [
  {
    id: 'pulse-orb',
    name: 'Pulse Orb',
    tagline: 'Core with expanding rings and a loading arc. Minimal and SSR-safe.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#818cf8',
    defaultColorTo: '#22d3ee',
    defaultSize: 168,
    files: [
      { label: 'pulse-orb.tsx', path: 'src/registry/orbe/pulse-orb/pulse-orb.tsx', lang: 'tsx', variant: 'css-modules' },
      { label: 'pulse-orb.module.css', path: 'src/registry/orbe/pulse-orb/pulse-orb.module.css', lang: 'css', variant: 'css-modules' },
      { label: 'pulse-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/pulse-orb/pulse-orb-tw.tsx', lang: 'tsx', variant: 'tailwind' },
    ],
  },
  {
    id: 'glass-orb',
    name: 'Glass Orb',
    tagline: 'Iridescent glassmorphism with a spinning conic aura and specular highlight.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#a78bfa',
    defaultColorTo: '#38bdf8',
    defaultSize: 168,
    files: [
      { label: 'glass-orb.tsx', path: 'src/registry/orbe/glass-orb/glass-orb.tsx', lang: 'tsx', variant: 'css-modules' },
      { label: 'glass-orb.module.css', path: 'src/registry/orbe/glass-orb/glass-orb.module.css', lang: 'css', variant: 'css-modules' },
      { label: 'glass-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/glass-orb/glass-orb-tw.tsx', lang: 'tsx', variant: 'tailwind' },
    ],
  },
  {
    id: 'pixel-orb',
    name: 'Pixel Orb',
    tagline: 'Pixel-art sphere on canvas: a grid that pulses and ripples with your voice.',
    tech: 'Canvas',
    dependencies: [],
    defaultColorFrom: '#34d399',
    defaultColorTo: '#22d3ee',
    defaultSize: 168,
    files: [{ label: 'pixel-orb.tsx', path: 'src/registry/orbe/pixel-orb/pixel-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'particles-orb',
    name: 'Particles Orb',
    tagline: 'Hundreds of particles form a rotating 3D sphere that breathes with your voice and scatters into a ring while connecting.',
    tech: 'Canvas',
    dependencies: [],
    defaultColorFrom: '#f0abfc',
    defaultColorTo: '#818cf8',
    defaultSize: 168,
    files: [
      { label: 'particles-orb.tsx', path: 'src/registry/orbe/particles-orb/particles-orb.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'equalizer-orb',
    name: 'Equalizer Orb',
    tagline: 'Equalizer bars inside a disc that react to the audio level.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#38bdf8',
    defaultColorTo: '#818cf8',
    defaultSize: 168,
    files: [
      { label: 'equalizer-orb.tsx', path: 'src/registry/orbe/equalizer-orb/equalizer-orb.tsx', lang: 'tsx', variant: 'css-modules' },
      { label: 'equalizer-orb.module.css', path: 'src/registry/orbe/equalizer-orb/equalizer-orb.module.css', lang: 'css', variant: 'css-modules' },
      { label: 'equalizer-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/equalizer-orb/equalizer-orb-tw.tsx', lang: 'tsx', variant: 'tailwind' },
    ],
  },
  {
    id: 'aurora-orb',
    name: 'Aurora Orb',
    tagline: 'Northern-lights veils that swirl and blur across a night sky.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#22d3ee',
    defaultColorTo: '#a855f7',
    defaultSize: 168,
    files: [
      { label: 'aurora-orb.tsx', path: 'src/registry/orbe/aurora-orb/aurora-orb.tsx', lang: 'tsx', variant: 'css-modules' },
      { label: 'aurora-orb.module.css', path: 'src/registry/orbe/aurora-orb/aurora-orb.module.css', lang: 'css', variant: 'css-modules' },
      { label: 'aurora-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/aurora-orb/aurora-orb-tw.tsx', lang: 'tsx', variant: 'tailwind' },
    ],
  },
  {
    id: 'halo-orb',
    name: 'Halo Orb',
    tagline: 'A conic halo with orbital rings and a bright core that pulses.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#818cf8',
    defaultColorTo: '#f472b6',
    defaultSize: 168,
    files: [
      { label: 'halo-orb.tsx', path: 'src/registry/orbe/halo-orb/halo-orb.tsx', lang: 'tsx', variant: 'css-modules' },
      { label: 'halo-orb.module.css', path: 'src/registry/orbe/halo-orb/halo-orb.module.css', lang: 'css', variant: 'css-modules' },
      { label: 'halo-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/halo-orb/halo-orb-tw.tsx', lang: 'tsx', variant: 'tailwind' },
    ],
  },
  {
    id: 'gooey-orb',
    name: 'Gooey Orb',
    tagline: 'Liquid blob whose edges “boil” with SVG noise and displacement.',
    tech: 'SVG filters',
    dependencies: [],
    defaultColorFrom: '#f472b6',
    defaultColorTo: '#8b5cf6',
    defaultSize: 168,
    files: [{ label: 'gooey-orb.tsx', path: 'src/registry/orbe/gooey-orb/gooey-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'plasma-orb',
    name: 'Plasma Orb',
    tagline: 'Shader mesh gradient on canvas, no Three.js. Organic distortion.',
    tech: 'Shader (canvas)',
    dependencies: ['@paper-design/shaders-react'],
    defaultColorFrom: '#7c3aed',
    defaultColorTo: '#06b6d4',
    defaultSize: 168,
    files: [{ label: 'plasma-orb.tsx', path: 'src/registry/orbe/plasma-orb/plasma-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'galaxy-orb',
    name: 'Galaxy Orb',
    tagline: 'A glassy bubble holding a drifting starfield and nebula, with a specular glare and an iridescent, chromatic rim.',
    tech: 'Canvas',
    dependencies: [],
    defaultColorFrom: '#c084fc',
    defaultColorTo: '#38bdf8',
    defaultSize: 168,
    files: [{ label: 'galaxy-orb.tsx', path: 'src/registry/orbe/galaxy-orb/galaxy-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'nebula-orb',
    name: 'Nebula Orb',
    tagline: '3D sphere with simplex-noise displacement and fresnel. The “voice mode”.',
    tech: 'WebGL (R3F + GLSL)',
    dependencies: ['three', '@react-three/fiber'],
    defaultColorFrom: '#8b5cf6',
    defaultColorTo: '#22d3ee',
    defaultSize: 184,
    files: [
      { label: 'nebula-orb.tsx', path: 'src/registry/orbe/nebula-orb/nebula-orb.tsx', lang: 'tsx' },
      { label: 'nebula-scene.tsx', path: 'src/registry/orbe/nebula-orb/nebula-scene.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'waveform-ring',
    name: 'Waveform Ring',
    tagline: 'A ring whose radius traces the live waveform: time-domain audio drawn in polar coordinates.',
    tech: 'Canvas',
    dependencies: [],
    defaultColorFrom: '#2dd4bf',
    defaultColorTo: '#38bdf8',
    defaultSize: 168,
    files: [
      { label: 'waveform-ring.tsx', path: 'src/registry/orbe/waveform-ring/waveform-ring.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'edge-glow',
    name: 'Edge Glow',
    tagline: 'Siri-style ambient frame: a masked conic-gradient glow that wraps your own content instead of sitting in the middle.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#f472b6',
    defaultColorTo: '#60a5fa',
    defaultSize: 168,
    files: [
      { label: 'edge-glow.tsx', path: 'src/registry/orbe/edge-glow/edge-glow.tsx', lang: 'tsx' },
      { label: 'edge-glow.module.css', path: 'src/registry/orbe/edge-glow/edge-glow.module.css', lang: 'css' },
    ],
  },
  {
    id: 'iridescent-flow',
    name: 'Iridescent Flow',
    tagline: 'Single-pass fragment shader with flowing iridescent hues. Raw WebGL, zero dependencies.',
    tech: 'Shader (canvas)',
    dependencies: [],
    defaultColorFrom: '#c084fc',
    defaultColorTo: '#67e8f9',
    defaultSize: 168,
    files: [
      { label: 'iridescent-flow.tsx', path: 'src/registry/orbe/iridescent-flow/iridescent-flow.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    tagline: 'Raymarched metaballs with a molten chrome finish. Raw WebGL, zero dependencies.',
    tech: 'Shader (canvas)',
    dependencies: [],
    defaultColorFrom: '#94a3b8',
    defaultColorTo: '#e2e8f0',
    defaultSize: 168,
    files: [
      { label: 'liquid-metal.tsx', path: 'src/registry/orbe/liquid-metal/liquid-metal.tsx', lang: 'tsx' },
    ],
  },
];
