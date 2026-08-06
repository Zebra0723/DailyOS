import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public marketing/legal pages are indexable; the signed-in app is not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/today",
        "/inbox",
        "/homeos",
        "/build-day",
        "/interests",
        "/world-clock",
        "/notes",
        "/calendar",
        "/tasks",
        "/vault",
        "/settings",
        "/onboarding",
        "/welcome",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
