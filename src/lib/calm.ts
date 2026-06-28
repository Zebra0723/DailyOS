// ----------------------------------------------------------------------------
// Optional "calm backgrounds" — gentle animated wave backdrops you can pick in
// Settings, on top of the light/dark mode. OFF by default so the standard look
// stays clean. The wave themes are dark, so selecting one forces light text.
// ----------------------------------------------------------------------------

export const MODE_KEY = "dailyos-mode";
export const BG_KEY = "dailyos-calm-bg";
export const APPEARANCE_EVENT = "dailyos-appearance";

export interface CalmBg {
  key: string;
  label: string;
  className: string;
  swatch: string; // picker preview
  dark: boolean; // needs light text
}

export const CALM_BGS: CalmBg[] = [
  { key: "none", label: "None", className: "", swatch: "#ffffff", dark: false },
  {
    key: "purple-waves",
    label: "Purple Waves",
    className: "calm-purple-waves",
    swatch: "#4c1d95",
    dark: true,
  },
  {
    key: "baby-waves",
    label: "Soft Waves",
    className: "calm-baby-waves",
    swatch: "#6d28d9",
    dark: true,
  },
];

export const CALM_BY_KEY: Record<string, CalmBg> = Object.fromEntries(
  CALM_BGS.map((b) => [b.key, b]),
);

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Read both saved prefs and apply text mode + canvas transparency. */
export function applyAppearance() {
  const mode = localStorage.getItem(MODE_KEY) ?? "system";
  const bgKey = localStorage.getItem(BG_KEY) ?? "none";
  const bg = CALM_BY_KEY[bgKey];
  const r = document.documentElement;

  const dark = bg?.dark ? true : mode === "dark" || (mode === "system" && prefersDark());
  r.classList.toggle("dark", dark);

  // When a wave background is on, make the canvas transparent so it shows.
  if (bg && bg.key !== "none") {
    r.style.setProperty("--app-bg", "transparent");
  } else {
    r.style.removeProperty("--app-bg");
  }
}
