"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Inbox, Sparkles, CheckSquare, Archive } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const SECONDS = 10;

const POINTS = [
  { icon: Inbox, text: "Drop in anything — receipts, bookings, letters, screenshots." },
  { icon: Sparkles, text: "DailyOS reads it and pulls out what matters." },
  { icon: CheckSquare, text: "It becomes tasks, reminders and calendar events." },
  { icon: Archive, text: "Everything filed in a calm, searchable vault." },
];

export function WelcomeScreen({ name }: { name: string }) {
  const router = useRouter();
  const [left, setLeft] = React.useState(SECONDS);
  // Guard so the click and the countdown can't both fire navigation, and so a
  // single tap reliably leaves on the first try.
  const leaving = React.useRef(false);

  const go = React.useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    router.push("/today");
  }, [router]);

  React.useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (left <= 0) go();
  }, [left, go]);

  const progress = ((SECONDS - left) / SECONDS) * 100;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative w-full max-w-lg animate-fade-in text-center">
        <Logo className="mx-auto" />

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome{name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-3 text-balance text-muted-foreground">
          Here&apos;s what DailyOS does for you — turning life admin into handled.
        </p>

        <div className="mt-8 grid gap-3 text-left">
          {POINTS.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <p.icon className="size-5" />
              </div>
              <p className="text-sm font-medium">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Taking you in… {Math.max(left, 0)}s
            </span>
            <Button variant="outline" onClick={go}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
