import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/discover", "/legal", "/u/"],
      disallow: ["/api/", "/account", "/admin", "/control"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
