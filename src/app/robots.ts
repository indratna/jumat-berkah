import type { MetadataRoute } from "next";

// NEXT_PUBLIC_APP_URL is inlined at build time, so the sitemap host has to come
// from that variable rather than from the request.
const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}