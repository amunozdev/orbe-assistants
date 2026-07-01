export interface OrbFile {
  label: string;
  path: string;
  lang: string;
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
];

export { SHARED_FILES };

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
      { label: 'pulse-orb.tsx', path: 'src/registry/orbe/pulse-orb/pulse-orb.tsx', lang: 'tsx' },
      { label: 'pulse-orb.module.css', path: 'src/registry/orbe/pulse-orb/pulse-orb.module.css', lang: 'css' },
      { label: 'pulse-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/pulse-orb/pulse-orb-tw.tsx', lang: 'tsx' },
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
      { label: 'glass-orb.tsx', path: 'src/registry/orbe/glass-orb/glass-orb.tsx', lang: 'tsx' },
      { label: 'glass-orb.module.css', path: 'src/registry/orbe/glass-orb/glass-orb.module.css', lang: 'css' },
      { label: 'glass-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/glass-orb/glass-orb-tw.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'pixel-orb',
    name: 'Pixel Orb',
    tagline: 'Esfera de arte pixelado en canvas: cuadrícula que late y ondula con la voz.',
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
    tagline: 'Enjambre de partículas que orbitan y respiran alrededor de un núcleo luminoso.',
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
    tagline: 'Barras de ecualizador dentro de un disco que reaccionan al nivel de audio.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#38bdf8',
    defaultColorTo: '#818cf8',
    defaultSize: 168,
    files: [
      { label: 'equalizer-orb.tsx', path: 'src/registry/orbe/equalizer-orb/equalizer-orb.tsx', lang: 'tsx' },
      { label: 'equalizer-orb.module.css', path: 'src/registry/orbe/equalizer-orb/equalizer-orb.module.css', lang: 'css' },
    ],
  },
  {
    id: 'aurora-orb',
    name: 'Aurora Orb',
    tagline: 'Velos de aurora boreal que giran y se difuminan sobre un cielo nocturno.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#22d3ee',
    defaultColorTo: '#a855f7',
    defaultSize: 168,
    files: [
      { label: 'aurora-orb.tsx', path: 'src/registry/orbe/aurora-orb/aurora-orb.tsx', lang: 'tsx' },
      { label: 'aurora-orb.module.css', path: 'src/registry/orbe/aurora-orb/aurora-orb.module.css', lang: 'css' },
    ],
  },
  {
    id: 'halo-orb',
    name: 'Halo Orb',
    tagline: 'Halo cónico con anillos orbitales y un núcleo brillante que pulsa.',
    tech: 'Pure CSS',
    dependencies: [],
    defaultColorFrom: '#818cf8',
    defaultColorTo: '#f472b6',
    defaultSize: 168,
    files: [
      { label: 'halo-orb.tsx', path: 'src/registry/orbe/halo-orb/halo-orb.tsx', lang: 'tsx' },
      { label: 'halo-orb.module.css', path: 'src/registry/orbe/halo-orb/halo-orb.module.css', lang: 'css' },
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
];
