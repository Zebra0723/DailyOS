"use client";

import * as React from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "work" | "break";
const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

export function PomodoroWidget() {
  const [mode, setMode] = React.useState<Mode>("work");
  const [secs, setSecs] = React.useState(WORK_SECS);
  const [running, setRunning] = React.useState(false);
  const [sessions, setSessions] = React.useState(0);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          setRunning(false);
          if (mode === "work") {
            setSessions((p) => p + 1);
            setMode("break");
            return BREAK_SECS;
          } else {
            setMode("work");
            return WORK_SECS;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  function reset() {
    setRunning(false);
    setMode("work");
    setSecs(WORK_SECS);
  }

  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const total = mode === "work" ? WORK_SECS : BREAK_SECS;
  const pct = ((total - secs) / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="size-4 text-primary" /> Pomodoro
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="relative mx-auto size-32">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-muted" />
            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * 2.827} ${282.7 - pct * 2.827}`} className={cn(mode === "work" ? "stroke-primary" : "stroke-emerald-500")} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{String(mins).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{mode}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button size="sm" onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
        {sessions > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{sessions} session{sessions > 1 ? "s" : ""} completed today</p>
        )}
      </CardContent>
    </Card>
  );
}
