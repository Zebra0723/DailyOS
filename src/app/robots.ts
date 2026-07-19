import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-os-lac.vercel.app";

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
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
