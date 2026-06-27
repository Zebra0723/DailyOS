"use client";

import * as React from "react";
import {
  SCENE_BY_KEY,
  SCENE_STORAGE_KEY,
  SCENE_VARIANT_STORAGE_KEY,
  APPEARANCE_EVENT,
} from "@/lib/appearance";

/** Renders the fixed scenic backdrop behind app content, live-updating. */
export function SceneBackground() {
  const [scene, setScene] = React.useState("none");
  const [variant, setVariant] = React.useState("");

  React.useEffect(() => {
    const read = () => {
      setScene(localStorage.getItem(SCENE_STORAGE_KEY) ?? "none");
      setVariant(localStorage.getItem(SCENE_VARIANT_STORAGE_KEY) ?? "");
    };
    read();
    window.addEventListener(APPEARANCE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(APPEARANCE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const opt = SCENE_BY_KEY[scene];
  if (!opt || scene === "none") return null;

  const variantClass = variant ? `v-${variant}` : "";
  return (
    <div className={`scene ${opt.className} ${variantClass}`} aria-hidden>
      {scene === "rain" && <div className="lightning" />}
    </div>
  );
}
