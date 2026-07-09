import type { MetadataRoute } from "next";

/** PWA manifest — lets DailyOS install to the home screen as an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DailyOS — Your life admin, finally handled.",
    short_name: "DailyOS",
    description:
      "Drop in receipts, bookings, letters and reminders — DailyOS sorts them into tasks, calendar events and a searchable vault.",
    id: "/",
    start_url: "/today",
    scope: "/",
    lang: "en-GB",
    dir: "ltr",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f2e9",
    theme_color: "#bf502b",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    // Long-press app-icon shortcuts (Android / desktop PWA).
    shortcuts: [
      {
        name: "Add to the Drop",
        short_name: "Add",
        url: "/inbox/new",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Today",
        url: "/today",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Ask DailyOS",
        url: "/assistant",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
