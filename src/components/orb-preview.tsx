'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { PulseOrb } from '@/registry/orbe/pulse-orb/pulse-orb';
import { GlassOrb } from '@/registry/orbe/glass-orb/glass-orb';
import { GooeyOrb } from '@/registry/orbe/gooey-orb/gooey-orb';
import { GalaxyOrb } from '@/registry/orbe/galaxy-orb/galaxy-orb';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { EqualizerOrb } from '@/registry/orbe/equalizer-orb/equalizer-orb';
import { AuroraOrb } from '@/registry/orbe/aurora-orb/aurora-orb';
import { HaloOrb } from '@/registry/orbe/halo-orb/halo-orb';
import { WaveformRing } from '@/registry/orbe/waveform-ring/waveform-ring';
import { EdgeGlow } from '@/registry/orbe/edge-glow/edge-glow';
import { IridescentFlow } from '@/registry/orbe/iridescent-flow/iridescent-flow';
import type { OrbProps } from '@/registry/lib/orb-state';

const MAP: Record<string, ComponentType<OrbProps>> = {
  'pulse-orb': PulseOrb,
  'glass-orb': GlassOrb,
  'gooey-orb': GooeyOrb,
  'galaxy-orb': GalaxyOrb,
  'particles-orb': ParticlesOrb,
  'equalizer-orb': EqualizerOrb,
  'aurora-orb': AuroraOrb,
  'halo-orb': HaloOrb,
  'waveform-ring': WaveformRing,
  'edge-glow': EdgeGlow,
  'iridescent-flow': IridescentFlow,
};

const DEFERRED_MAP: Record<string, ComponentType<OrbProps>> = {
  'plasma-orb': dynamic(() => import('@/registry/orbe/plasma-orb/plasma-orb').then((m) => m.PlasmaOrb), {
    ssr: false,
  }),
  'nebula-orb': dynamic(() => import('@/registry/orbe/nebula-orb/nebula-orb').then((m) => m.NebulaOrb), {
    ssr: false,
  }),
  'radiance-orb': dynamic(() => import('@/registry/orbe/radiance-orb/radiance-orb').then((m) => m.RadianceOrb), {
    ssr: false,
  }),
  'dither-orb': dynamic(() => import('@/registry/orbe/dither-orb/dither-orb').then((m) => m.DitherOrb), {
    ssr: false,
  }),
  'dot-orbit': dynamic(() => import('@/registry/orbe/dot-orbit/dot-orbit').then((m) => m.DotOrbit), {
    ssr: false,
  }),
  'grain-orb': dynamic(() => import('@/registry/orbe/grain-orb/grain-orb').then((m) => m.GrainOrb), {
    ssr: false,
  }),
  'mercury-orb': dynamic(() => import('@/registry/orbe/mercury-orb/mercury-orb').then((m) => m.MercuryOrb), {
    ssr: false,
  }),
};

const DeferredOrb = ({ orb: Orb, ...props }: OrbProps & { orb: ComponentType<OrbProps> }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = hostRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  const { size = 168, colorFrom = '#8b5cf6', colorTo = '#22d3ee', label = 'Assistant orb' } = props;

  return (
    <div ref={hostRef} style={{ width: size, height: size, position: 'relative' }}>
      {near ? (
        <Orb {...props} />
      ) : (
        <div
          role="img"
          aria-label={label}
          style={{
            position: 'absolute',
            inset: '10%',
            borderRadius: '50%',
            background: `radial-gradient(circle at 36% 30%, ${colorTo} 0%, ${colorFrom} 62%, transparent 100%)`,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
};

interface OrbPreviewProps extends OrbProps {
  id: string;
}

export const OrbPreview = ({ id, ...props }: OrbPreviewProps) => {
  const Deferred = DEFERRED_MAP[id];
  if (Deferred) return <DeferredOrb orb={Deferred} {...props} />;
  const Orb = MAP[id];
  return Orb ? <Orb {...props} /> : null;
};
