import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://orbe-assistants.vercel.app",
      lastModified: new Date(),
    },
  ];
}
