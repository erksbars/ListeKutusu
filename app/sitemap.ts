import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/discover`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/suggest`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/forum`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/legal`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
