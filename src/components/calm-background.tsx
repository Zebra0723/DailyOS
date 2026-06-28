"use client";

import * as React from "react";
import { CALM_BY_KEY, BG_KEY, APPEARANCE_EVENT } from "@/lib/calm";

/** Renders the chosen animated wave backdrop behind app content. */
export function CalmBackground() {
  const [bg, setBg] = React.useState("none");

  React.useEffect(() => {
    const read = () => setBg(localStorage.getItem(BG_KEY) ?? "none");
    read();
    window.addEventListener(APPEARANCE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(APPEARANCE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const opt = CALM_BY_KEY[bg];
  if (!opt || opt.key === "none") return null;

  return <div className={`calm-bg ${opt.className}`} aria-hidden />;
}
