import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/tools/subscription-tracker",
    "/pricing",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
  ];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    // Home and the free tool (our search-traffic entry point) are top priority.
    priority: path === "" || path.startsWith("/tools/") ? 1 : 0.6,
  }));
}
