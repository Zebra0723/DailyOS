// ----------------------------------------------------------------------------
// Background colours + scenic "themes" for the app canvas.
//
// - Background colour sets the --app-bg CSS variable (the canvas behind cards).
// - A scene (rain/desert/city/beach) paints an animated full-screen backdrop
//   instead; while a scene is active, --app-bg is transparent so it shows.
//
// Choices persist in localStorage and apply instantly across the app.
// ----------------------------------------------------------------------------

export interface BackgroundOption {
  key: string;
  label: string;
  color: string; // CSS colour for --app-bg + the picker swatch
  dark?: boolean; // needs light text
}

export const BACKGROUNDS: BackgroundOption[] = [
  { key: "cloud", label: "Cloud", color: "#f4f5f7" },
  { key: "mist", label: "Mist", color: "#e9eef5" },
  { key: "cream", label: "Cream", color: "#faf6ee" },
  { key: "blush", label: "Blush", color: "#fdeef2" },
  { key: "sage", label: "Sage", color: "#eef4ee" },
  { key: "lavender", label: "Lavender", color: "#f1edfb" },
  { key: "sky", label: "Sky", color: "#e9f3fd" },
  { key: "slate", label: "Slate", color: "#20232e", dark: true },
];

export const BG_DARK: Record<string, boolean> = Object.fromEntries(
  BACKGROUNDS.map((b) => [b.key, Boolean(b.dark)]),
);

export const DEFAULT_BG = "cloud";

export const BG_BY_KEY: Record<string, string> = Object.fromEntries(
  BACKGROUNDS.map((b) => [b.key, b.color]),
);

export interface SceneVariant {
  key: string;
  label: string;
}
export interface SceneOption {
  key: string;
  label: string;
  className: string;
  variants: SceneVariant[];
  dark?: boolean; // needs light text
}

export const SCENES: SceneOption[] = [
  { key: "none", label: "None", className: "", variants: [] },
  { key: "rain", label: "Rain", className: "scene-rain", variants: [], dark: true },
  { key: "desert", label: "Desert", className: "scene-desert", variants: [] },
  {
    key: "city",
    label: "City",
    className: "scene-city",
    dark: true,
    variants: [
      { key: "london", label: "London" },
      { key: "rome", label: "Rome" },
      { key: "newyork", label: "New York" },
    ],
  },
  {
    key: "beach",
    label: "Beach",
    className: "scene-beach",
    variants: [
      { key: "busy", label: "Busy" },
      { key: "empty", label: "Empty" },
    ],
  },
];

export const SCENE_BY_KEY: Record<string, SceneOption> = Object.fromEntries(
  SCENES.map((s) => [s.key, s]),
);

export const BG_STORAGE_KEY = "dailyos-bg";
export const SCENE_STORAGE_KEY = "dailyos-scene";
export const SCENE_VARIANT_STORAGE_KEY = "dailyos-scene-variant";

/** Event other components listen for to re-read appearance live. */
export const APPEARANCE_EVENT = "dailyos-appearance";

export const SCENE_DARK: Record<string, boolean> = Object.fromEntries(
  SCENES.map((s) => [s.key, Boolean(s.dark)]),
);

/** True when the chosen background/scene is dark and needs light text. */
export function isDarkAppearance(bgKey: string, sceneKey: string): boolean {
  return sceneKey !== "none" ? Boolean(SCENE_DARK[sceneKey]) : Boolean(BG_DARK[bgKey]);
}

/**
 * Apply the chosen background + scene to the canvas and flip the text
 * theme (light/dark) so it stays readable. Client-side.
 */
export function applyAppearance(bgKey: string, sceneKey: string) {
  const root = document.documentElement;
  const sceneActive = sceneKey !== "none";
  root.style.setProperty(
    "--app-bg",
    sceneActive ? "transparent" : BG_BY_KEY[bgKey] ?? BG_BY_KEY[DEFAULT_BG],
  );
  root.classList.toggle("dark", isDarkAppearance(bgKey, sceneKey));
}
