import { ImageResponse } from 'next/og';
import { orbs } from '@/registry/registry';

export const generateStaticParams = () => orbs.map(({ id }) => ({ id }));

export const alt = 'Animated AI-assistant orb from the VoiceOrbs gallery';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orb = orbs.find((o) => o.id === id);
  const name = orb?.name ?? 'VoiceOrbs';
  const tagline =
    orb?.tagline ?? 'Open-source copy-paste gallery of animated orbs for AI assistants.';
  const from = orb?.defaultColorFrom ?? '#818cf8';
  const to = orb?.defaultColorTo ?? '#22d3ee';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 96,
          backgroundColor: '#070811',
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 340,
            height: 340,
            borderRadius: 340,
            display: 'flex',
            backgroundImage: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${from} 32%, ${to} 88%)`,
            boxShadow: `0 0 120px 30px ${from}66, 0 0 260px 80px ${to}33`,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 560,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: '#9aa1c2',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            VoiceOrbs
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 68,
              fontWeight: 700,
              color: '#f4f5fb',
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              color: '#9aa1c2',
              lineHeight: 1.4,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
