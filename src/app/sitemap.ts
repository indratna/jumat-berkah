import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

// Only pages that are meant to be indexed. /admin, /api, /login and /masuk are
// deliberately left out.
const pages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/donasi", changeFrequency: "weekly", priority: 0.9 },
  { path: "/laporan", changeFrequency: "daily", priority: 0.9 },
  { path: "/tentang", changeFrequency: "monthly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}