const PRODUCTION_SITE_URL = "https://www.dailyos.uk";

/** Canonical origin. Local development may override it; production may not. */
export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_SITE_URL
    : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
