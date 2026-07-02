'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const toHex = (color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return color;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

export const ThemeColorSync = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const frame = window.requestAnimationFrame(() => {
      const color = window.getComputedStyle(document.body).backgroundColor;
      if (!color) return;
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.append(meta);
      }
      meta.content = toHex(color);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  return null;
};
