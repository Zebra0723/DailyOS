"use client";

import * as React from "react";
import { RotateCcw, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Scene geometry (in px, within the scene box).
const GROUND = 44; // height of the grass strip
const STEM_MAX = 210; // fully-grown stem height
const GROW_MS = 4200; // hold time to grow from nothing to full
const DECAY_MS = 2600; // how fast it shrinks back when you let go
const BLOOM_TO_GREET_MS = 2300; // sun descends, then the flower turns to you

type Phase = "grow" | "sun" | "greet";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `dailyos-plant-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}`;
}

export function GrowPlant() {
  const [mounted, setMounted] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("grow");
  const [progress, setProgress] = React.useState(0); // 0..1

  const holdingRef = React.useRef(false);
  const progressRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const lastRef = React.useRef<number | null>(null);
  const phaseRef = React.useRef<Phase>("grow");

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem(todayKey()) === "1") {
      // Already grown today — show the finished flower greeting the user.
      progressRef.current = 1;
      setProgress(1);
      phaseRef.current = "greet";
      setPhase("greet");
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function bloom() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastRef.current = null;
    localStorage.setItem(todayKey(), "1");
    phaseRef.current = "sun";
    setPhase("sun");
    window.setTimeout(() => {
      phaseRef.current = "greet";
      setPhase("greet");
    }, BLOOM_TO_GREET_MS);
  }

  function loop(t: number) {
    if (lastRef.current == null) lastRef.current = t;
    const dt = t - lastRef.current;
    lastRef.current = t;

    let p = progressRef.current;
    p += holdingRef.current ? dt / GROW_MS : -dt / DECAY_MS;
    p = Math.max(0, Math.min(1, p));
    progressRef.current = p;
    setProgress(p);

    if (p >= 1) {
      bloom();
      return;
    }
    if (!holdingRef.current && p <= 0) {
      // Settled back to nothing — stop the loop until the next hold.
      rafRef.current = null;
      lastRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function startHold() {
    if (phaseRef.current !== "grow") return;
    holdingRef.current = true;
    if (rafRef.current == null) {
      lastRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  function endHold() {
    holdingRef.current = false;
  }

  function growAgain() {
    localStorage.removeItem(todayKey());
    progressRef.current = 0;
    setProgress(0);
    phaseRef.current = "grow";
    setPhase("grow");
  }

  if (!mounted) {
    return <Card className="h-[380px] animate-pulse" />;
  }

  const bloomed = phase !== "grow";
  const stemPx = bloomed ? STEM_MAX : progress * STEM_MAX;
  const headScale = bloomed
    ? 1
    : Math.max(0, Math.min(1, (progress - 0.4) / 0.6));

  // The flower head turns toward the sun (top-right), then back to face you.
  const headAngle = phase === "sun" ? 22 : 0;
  // Leaves unfurl as the stem climbs.
  const leftLeaf = Math.max(0, Math.min(1, (progress - 0.3) / 0.25));
  const rightLeaf = Math.max(0, Math.min(1, (progress - 0.55) / 0.25));

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 p-0 shadow-elevated">
        <div
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          className="relative h-[380px] w-full cursor-pointer select-none"
          style={{
            touchAction: "none",
            background:
              "linear-gradient(180deg, #bae6fd 0%, #e0f2fe 45%, #f0f9ff 100%)",
          }}
          role="button"
          aria-label="Press and hold to grow your sunflower"
        >
          {/* Sun — descends from the top-right once the flower is grown. */}
          <div
            aria-hidden
            className={bloomed ? "sun-glow" : undefined}
            style={{
              position: "absolute",
              height: 64,
              width: 64,
              borderRadius: "9999px",
              background: "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b)",
              top: bloomed ? "12%" : "-30%",
              right: "12%",
              opacity: bloomed ? 1 : 0,
              transition: "top 1.6s cubic-bezier(0.2,0.7,0.2,1), opacity 0.8s ease",
            }}
          />

          {/* Speech bubble — the flower turns to you and speaks. */}
          {phase === "greet" && (
            <div
              className="animate-float"
              style={{
                position: "absolute",
                top: 26,
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: 280,
              }}
            >
              <div className="rounded-2xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-800 shadow-lg">
                Come back tomorrow to grow another plant! 🌻
              </div>
            </div>
          )}

          {/* Ground */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              insetInline: 0,
              bottom: 0,
              height: GROUND,
              background: "linear-gradient(180deg, #4ade80, #16a34a)",
            }}
          />

          {/* Plant — anchored to a point on the ground, centred. */}
          <div
            aria-hidden
            style={{ position: "absolute", left: "50%", bottom: GROUND }}
          >
            {/* Stem */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                transform: "translateX(-50%)",
                width: 12,
                height: stemPx,
                borderRadius: 9999,
                background: "linear-gradient(180deg, #4ade80, #15803d)",
              }}
            />
            {/* Leaves */}
            <Leaf side="left" t={leftLeaf} bottom={stemPx * 0.45} />
            <Leaf side="right" t={rightLeaf} bottom={stemPx * 0.68} />

            {/* Flower head */}
            <div
              className={phase === "greet" ? "plant-sway" : undefined}
              style={{
                position: "absolute",
                left: 0,
                bottom: stemPx,
                transformOrigin: "bottom center",
                transform: `translateX(-50%) scale(${headScale}) rotate(${headAngle}deg)`,
                transition:
                  phase === "grow"
                    ? "none"
                    : "transform 1.2s cubic-bezier(0.2,0.7,0.2,1)",
                fontSize: 92,
                lineHeight: 1,
                filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.15))",
              }}
            >
              🌻
            </div>
          </div>

          {/* Hint + progress while growing */}
          {phase === "grow" && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-3"
              style={{ paddingBottom: GROUND + 10 }}
            >
              <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                {progress > 0 ? "Keep holding…" : "Press & hold to grow 🌱"}
              </p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-amber-400 transition-[width] duration-75"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {phase === "greet" && (
        <div className="flex items-center justify-center">
          <Button variant="ghost" size="sm" onClick={growAgain}>
            <RotateCcw className="size-4" /> Grow again
          </Button>
        </div>
      )}

      {phase === "grow" && progress === 0 && (
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
          <Sprout className="size-4" /> Hold anywhere on the scene until your
          sunflower blooms.
        </p>
      )}
    </div>
  );
}

function Leaf({
  side,
  t,
  bottom,
}: {
  side: "left" | "right";
  t: number;
  bottom: number;
}) {
  const dir = side === "left" ? -1 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom,
        transformOrigin: "left center",
        transform: `translateX(${dir * 2}px) scaleX(${dir}) scale(${t}) rotate(-18deg)`,
        opacity: t,
        width: 46,
        height: 22,
        borderRadius: "0 100% 0 100%",
        background: "linear-gradient(135deg, #4ade80, #16a34a)",
      }}
    />
  );
}
