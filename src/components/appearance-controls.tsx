"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  BACKGROUNDS,
  SCENES,
  SCENE_BY_KEY,
  DEFAULT_BG,
  BG_STORAGE_KEY,
  SCENE_STORAGE_KEY,
  SCENE_VARIANT_STORAGE_KEY,
  APPEARANCE_EVENT,
  applyAppearance,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

export function AppearanceControls() {
  const [bg, setBg] = React.useState(DEFAULT_BG);
  const [scene, setScene] = React.useState("none");
  const [variant, setVariant] = React.useState("");

  React.useEffect(() => {
    setBg(localStorage.getItem(BG_STORAGE_KEY) ?? DEFAULT_BG);
    setScene(localStorage.getItem(SCENE_STORAGE_KEY) ?? "none");
    setVariant(localStorage.getItem(SCENE_VARIANT_STORAGE_KEY) ?? "");
  }, []);

  function persistAndApply(nextBg: string, nextScene: string, nextVariant: string) {
    localStorage.setItem(BG_STORAGE_KEY, nextBg);
    localStorage.setItem(SCENE_STORAGE_KEY, nextScene);
    localStorage.setItem(SCENE_VARIANT_STORAGE_KEY, nextVariant);
    applyAppearance(nextBg, nextScene);
    window.dispatchEvent(new Event(APPEARANCE_EVENT));
  }

  function pickBg(key: string) {
    setBg(key);
    persistAndApply(key, scene, variant);
  }

  function pickScene(key: string) {
    const opt = SCENE_BY_KEY[key];
    const nextVariant = opt?.variants[0]?.key ?? "";
    setScene(key);
    setVariant(nextVariant);
    persistAndApply(bg, key, nextVariant);
  }

  function pickVariant(key: string) {
    setVariant(key);
    persistAndApply(bg, scene, key);
  }

  const sceneOpt = SCENE_BY_KEY[scene];

  return (
    <div className="space-y-6">
      {/* Background colours */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Background colour</p>
        <div className="flex flex-wrap gap-2.5">
          {BACKGROUNDS.map((b) => {
            const selected = scene === "none" && bg === b.key;
            return (
              <button
                key={b.key}
                type="button"
                title={b.label}
                aria-label={b.label}
                onClick={() => pickBg(b.key)}
                className={cn(
                  "grid size-9 place-items-center rounded-full border ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                  selected && "ring-2 ring-foreground",
                )}
                style={{ backgroundColor: b.color }}
              >
                {selected && (
                  <Check className="size-4 text-foreground mix-blend-difference" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Used when no scene is selected.
        </p>
      </div>

      {/* Scenes */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Scene</p>
        <div className="flex flex-wrap gap-2">
          {SCENES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => pickScene(s.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                scene === s.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Variant sub-picker */}
        {sceneOpt?.variants.length ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">{sceneOpt.label}:</span>
            {sceneOpt.variants.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => pickVariant(v.key)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  variant === v.key
                    ? "border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
