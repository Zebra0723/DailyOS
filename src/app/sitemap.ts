import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/tools",
    "/tools/subscription-tracker",
    "/tools/renewal-tracker",
    "/blog",
    ...POSTS.map((p) => `/blog/${p.slug}`),
    "/pricing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
  ];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    // Home, the free tools and blog are our search-traffic entry points.
    priority:
      path === "" || path.startsWith("/tools/") || path.startsWith("/blog")
        ? 1
        : 0.6,
  }));
}
