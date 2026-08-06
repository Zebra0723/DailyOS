"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, SwatchBook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dailyos-dev-palette";

const PALETTES = [
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Clear blue with a cool sea-glass accent.",
    colors: ["#f3f8fc", "#ffffff", "#1976a8", "#9adbdc", "#183040"],
  },
  {
    id: "evergreen",
    name: "Evergreen",
    description: "Deep garden green with fresh leaf tones.",
    colors: ["#f3f8f4", "#ffffff", "#2f7d4c", "#c9df9c", "#1b3022"],
  },
  {
    id: "lavender",
    name: "Lavender",
    description: "Soft violet balanced by a gentle orchid accent.",
    colors: ["#f7f4fb", "#ffffff", "#7650b6", "#e4c6df", "#2d2439"],
  },
  {
    id: "rosewood",
    name: "Rosewood",
    description: "Dusty rose with warm peach highlights.",
    colors: ["#fbf4f6", "#ffffff", "#a9415d", "#f1d0b9", "#3c232a"],
  },
  {
    id: "cobalt",
    name: "Cobalt & Amber",
    description: "Confident blue with a warm golden counterpoint.",
    colors: ["#f3f5fb", "#ffffff", "#3857b7", "#ead59a", "#202a49"],
  },
  {
    id: "citrus",
    name: "Citrus Grove",
    description: "Golden citrus paired with lively green.",
    colors: ["#faf9ef", "#ffffff", "#b46e19", "#d9e8ae", "#34331f"],
  },
  {
    id: "aqua",
    name: "Aqua & Coral",
    description: "Fresh teal softened by a coral accent.",
    colors: ["#f0f9f9", "#ffffff", "#23857f", "#f0c4bb", "#173837"],
  },
  {
    id: "berry",
    name: "Berry Plum",
    description: "Rich berry with a subtle purple undertone.",
    colors: ["#faf3f9", "#ffffff", "#9b3c85", "#d9c2ea", "#3a2536"],
  },
  {
    id: "sage",
    name: "Sage Moss",
    description: "Quiet natural greens with an earthy softness.",
    colors: ["#f5f7f1", "#ffffff", "#557b50", "#dce2b7", "#293127"],
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "A restrained neutral system with cool steel accents.",
    colors: ["#f4f5f6", "#ffffff", "#59636e", "#c7d9df", "#22272d"],
  },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

function isPaletteId(value: string | null): value is PaletteId {
  return PALETTES.some((palette) => palette.id === value);
}

function applyPalette(palette: PaletteId | null) {
  if (palette) {
    document.documentElement.dataset.devPalette = palette;
    sessionStorage.setItem(STORAGE_KEY, palette);
  } else {
    delete document.documentElement.dataset.devPalette;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function DevUiPalettePicker() {
  const [selected, setSelected] = React.useState<PaletteId | null>(null);

  React.useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (isPaletteId(saved)) setSelected(saved);
  }, []);

  function pick(palette: PaletteId) {
    setSelected(palette);
    applyPalette(palette);
  }

  function reset() {
    setSelected(null);
    applyPalette(null);
  }

  const selectedName = PALETTES.find((palette) => palette.id === selected)?.name;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/25 bg-accent/25">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <SwatchBook className="size-5" />
            </div>
            <div>
              <p className="font-semibold">
                {selectedName
                  ? `${selectedName} is active`
                  : "Original DailyOS colors are active"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This preview follows you around the website for this browser
                session only.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={reset} disabled={!selected}>
              <RotateCcw className="size-4" />
              Reset to DailyOS
            </Button>
            <Button asChild>
              <Link href="/today">
                View Today
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Preview in light or dark mode</p>
          <p className="text-xs text-muted-foreground">
            Every palette supports both. The fonts remain unchanged.
          </p>
        </div>
        <ModeToggle />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PALETTES.map((palette, index) => {
          const active = selected === palette.id;
          const [background, surface, primary, accent, ink] = palette.colors;

          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => pick(palette.id)}
              aria-pressed={active}
              className={cn(
                "group overflow-hidden rounded-xl border bg-card text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active &&
                  "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              <div className="p-4" style={{ backgroundColor: background }}>
                <div
                  className="overflow-hidden rounded-lg border border-black/10 shadow-sm"
                  style={{ backgroundColor: surface, color: ink }}
                >
                  <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
                    <span className="font-display text-sm font-semibold">DailyOS</span>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: primary }}
                    />
                  </div>
                  <div className="space-y-2.5 p-3">
                    <div className="h-2 w-3/5 rounded-full bg-black/15" />
                    <div className="flex gap-2">
                      <div
                        className="h-10 flex-1 rounded-md"
                        style={{ backgroundColor: accent }}
                      />
                      <div
                        className="h-10 flex-1 rounded-md"
                        style={{ backgroundColor: `${primary}22` }}
                      />
                    </div>
                    <div
                      className="h-5 w-20 rounded-md"
                      style={{ backgroundColor: primary }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4">
                <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {palette.name}
                    {active && (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {palette.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
