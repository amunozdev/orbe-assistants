'use client';

import type { ComponentType } from 'react';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';
import { GlassOrb } from '@/registry/orbe/glass-orb/glass-orb';
import { GooeyOrb } from '@/registry/orbe/gooey-orb/gooey-orb';
import { PlasmaOrb } from '@/registry/orbe/plasma-orb/plasma-orb';
import { NebulaOrb } from '@/registry/orbe/nebula-orb/nebula-orb';
import { GalaxyOrb } from '@/registry/orbe/galaxy-orb/galaxy-orb';
import { PixelOrb } from '@/registry/orbe/pixel-orb/pixel-orb';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { EqualizerOrb } from '@/registry/orbe/equalizer-orb/equalizer-orb';
import { AuroraOrb } from '@/registry/orbe/aurora-orb/aurora-orb';
import { HaloOrb } from '@/registry/orbe/halo-orb/halo-orb';
import { WaveformRing } from '@/registry/orbe/waveform-ring/waveform-ring';
import { EdgeGlow } from '@/registry/orbe/edge-glow/edge-glow';
import { IridescentFlow } from '@/registry/orbe/iridescent-flow/iridescent-flow';
import { LiquidMetal } from '@/registry/orbe/liquid-metal/liquid-metal';
import type { OrbProps } from '@/registry/lib/orb-state';

const MAP: Record<string, ComponentType<OrbProps>> = {
  'pulse-orb': PulseOrb,
  'glass-orb': GlassOrb,
  'gooey-orb': GooeyOrb,
  'plasma-orb': PlasmaOrb,
  'nebula-orb': NebulaOrb,
  'galaxy-orb': GalaxyOrb,
  'pixel-orb': PixelOrb,
  'particles-orb': ParticlesOrb,
  'equalizer-orb': EqualizerOrb,
  'aurora-orb': AuroraOrb,
  'halo-orb': HaloOrb,
  'waveform-ring': WaveformRing,
  'edge-glow': EdgeGlow,
  'iridescent-flow': IridescentFlow,
  'liquid-metal': LiquidMetal,
};

interface OrbPreviewProps extends OrbProps {
  id: string;
}

export const OrbPreview = ({ id, ...props }: OrbPreviewProps) => {
  const Orb = MAP[id];
  return Orb ? <Orb {...props} /> : null;
};
