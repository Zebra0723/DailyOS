// ----------------------------------------------------------------------------
// Accent themes. Each preset overrides a handful of CSS variables on
// :root at runtime. The user's choice is saved in localStorage and applied
// before paint (see the inline script in app/layout.tsx) so there's no flash.
//
// Values are HSL triplets to match the tokens in globals.css.
// ----------------------------------------------------------------------------

export interface Theme {
  key: string;
  label: string;
  swatch: string; // hex, used for the picker dot
  vars: Record<string, string>;
}

function make(
  key: string,
  label: string,
  swatch: string,
  primary: string,
  accent: string,
  accentFg: string,
  primaryFg = "0 0% 100%",
): Theme {
  return {
    key,
    label,
    swatch,
    vars: {
      "--primary": primary,
      "--primary-foreground": primaryFg,
      "--ring": primary,
      "--accent": accent,
      "--accent-foreground": accentFg,
    },
  };
}

export const THEMES: Theme[] = [
  make("indigo", "Indigo", "#4f46e5", "243 75% 59%", "243 90% 96%", "243 70% 42%"),
  make("violet", "Violet", "#7c3aed", "262 76% 58%", "262 90% 96%", "262 65% 45%"),
  make("blue", "Ocean", "#2563eb", "221 83% 55%", "214 95% 95%", "221 75% 42%"),
  make("emerald", "Emerald", "#059669", "160 75% 38%", "160 60% 94%", "161 80% 26%"),
  make("rose", "Rose", "#e11d48", "347 80% 53%", "347 90% 96%", "347 70% 42%"),
  make("amber", "Amber", "#d97706", "32 95% 44%", "40 96% 92%", "28 80% 34%"),
  make("slate", "Graphite", "#334155", "222 30% 25%", "220 16% 94%", "222 30% 25%"),
];

export const DEFAULT_THEME_KEY = "indigo";

/** Serialised map for the no-flash inline script. */
export const THEME_VARS_BY_KEY: Record<string, Record<string, string>> =
  Object.fromEntries(THEMES.map((t) => [t.key, t.vars]));
