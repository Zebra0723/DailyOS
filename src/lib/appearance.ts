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
}

export const BACKGROUNDS: BackgroundOption[] = [
  { key: "cloud", label: "Cloud", color: "#f4f5f7" },
  { key: "mist", label: "Mist", color: "#e9eef5" },
  { key: "cream", label: "Cream", color: "#faf6ee" },
  { key: "blush", label: "Blush", color: "#fdeef2" },
  { key: "sage", label: "Sage", color: "#eef4ee" },
  { key: "lavender", label: "Lavender", color: "#f1edfb" },
  { key: "sky", label: "Sky", color: "#e9f3fd" },
  { key: "slate", label: "Slate", color: "#20232e" },
];

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
}

export const SCENES: SceneOption[] = [
  { key: "none", label: "None", className: "", variants: [] },
  { key: "rain", label: "Rain", className: "scene-rain", variants: [] },
  { key: "desert", label: "Desert", className: "scene-desert", variants: [] },
  {
    key: "city",
    label: "City",
    className: "scene-city",
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

/** Apply the chosen background colour to the canvas (client-side). */
export function applyBackground(bgKey: string, sceneActive: boolean) {
  const root = document.documentElement;
  if (sceneActive) {
    root.style.setProperty("--app-bg", "transparent");
  } else {
    root.style.setProperty("--app-bg", BG_BY_KEY[bgKey] ?? BG_BY_KEY[DEFAULT_BG]);
  }
}
