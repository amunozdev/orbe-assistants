export interface GradientPreset {
  name: string;
  from: string;
  to: string;
}

export const BASE_PRESETS: GradientPreset[] = [
  { name: 'Iris', from: '#818cf8', to: '#22d3ee' },
  { name: 'Orquídea', from: '#8b5cf6', to: '#d946ef' },
  { name: 'Aurora', from: '#22d3ee', to: '#34d399' },
  { name: 'Atardecer', from: '#fbbf24', to: '#f43f5e' },
  { name: 'Cósmico', from: '#fc466b', to: '#3f5efb' },
  { name: 'Neón', from: '#22d3ee', to: '#d946ef' },
  { name: 'Metal', from: '#94a3b8', to: '#e2e8f0' },
];

const ORB_PRESETS: Record<string, GradientPreset[]> = {
  'galaxy-orb': [{ name: 'Nebulosa', from: '#4f46e5', to: '#ec4899' }],
  'nebula-orb': [{ name: 'Nebulosa', from: '#4f46e5', to: '#ec4899' }],
  'iridescent-flow': [{ name: 'Iridiscente', from: '#22d3ee', to: '#a855f7' }],
  'plasma-orb': [{ name: 'Magma', from: '#f43f5e', to: '#fb923c' }],
  'aurora-orb': [{ name: 'Boreal', from: '#2dd4bf', to: '#4ade80' }],
  'mercury-orb': [{ name: 'Cromo dorado', from: '#b45309', to: '#fde68a' }],
};

export const presetsForOrb = (id: string): GradientPreset[] => [
  ...BASE_PRESETS,
  ...(ORB_PRESETS[id] ?? []),
];

export const isSamePreset = (
  preset: GradientPreset,
  from: string,
  to: string,
): boolean =>
  preset.from.toLowerCase() === from.toLowerCase() &&
  preset.to.toLowerCase() === to.toLowerCase();
