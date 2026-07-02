import type { MetadataRoute } from 'next';
import { orbs } from '@/registry/registry';

const BASE_URL = 'https://orbe-assistants.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: BASE_URL, lastModified },
    { url: `${BASE_URL}/recipes`, lastModified },
    ...orbs.map(({ id }) => ({ url: `${BASE_URL}/orbs/${id}`, lastModified })),
  ];
}
