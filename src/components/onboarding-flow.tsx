"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2, Check, Smartphone, type LucideIcon } from "lucide-react";
import { saveOnboarding } from "@/app/onboarding/actions";
import { InstallApp } from "@/components/install-app";
import { PushToggle } from "@/components/push-toggle";
import {
  PERSONAS,
  FOCUS_OPTIONS,
  TONES,
  type Persona,
  type Tone,
} from "@/lib/onboarding";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function OnboardingFlow({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState(initialName);
  const [persona, setPersona] = React.useState<Persona | null>(null);
  const [focus, setFocus] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState<Tone | null>(null);
  const [saving, setSaving] = React.useState(false);

  const steps = ["name", "persona", "focus", "tone", "notify"] as const;
  const canNext =
    (step === 0) ||
    (step === 1 && persona) ||
    (step === 2) ||
    (step === 3 && tone) ||
    (step === 4);

  function toggleFocus(key: string) {
    setFocus((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]));
  }

  async function finish() {
    setSaving(true);
    await saveOnboarding({
      persona: persona ?? "adult",
      focus,
      tone: tone ?? "warm",
      done: true,
      name: name.trim() || undefined,
    });
    router.push("/welcome");
    router.refresh();
  }

  function skip() {
    router.push("/welcome");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground">
            Skip
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="animate-fade-in">
          {step === 0 && (
            <Step title="First up — what should we call you?" subtitle="We'll use it to greet you around the app.">
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 text-base"
                onKeyDown={(e) => e.key === "Enter" && setStep(1)}
              />
            </Step>
          )}

          {step === 1 && (
            <Step title="Who's DailyOS for?" subtitle="So we can pitch it just right.">
              <div className="grid gap-2.5">
                {PERSONAS.map((p) => (
                  <Choice
                    key={p.key}
                    selected={persona === p.key}
                    onClick={() => setPersona(p.key)}
                    icon={p.icon}
                    label={p.label}
                    desc={p.desc}
                  />
                ))}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step title="What do you most want help with?" subtitle="Pick any that fit — we'll surface the right things.">
              <div className="flex flex-wrap gap-2">
                {FOCUS_OPTIONS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleFocus(f.key)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        focus.includes(f.key)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-card hover:bg-accent",
                      )}
                    >
                      <Icon className="size-4" />
                      {f.label}
                      {focus.includes(f.key) && <Check className="size-4" />}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 3 && (
            <Step title="How should DailyOS talk to you?" subtitle="We'll match the vibe.">
              <div className="grid gap-2.5">
                {TONES.map((t) => (
                  <Choice
                    key={t.key}
                    selected={tone === t.key}
                    onClick={() => setTone(t.key)}
                    icon={t.icon}
                    label={t.label}
                  />
                ))}
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Want a nudge when it matters?"
              subtitle="Get notified about reminders you set, events coming up, and reward codes about to expire — even when DailyOS is closed. Totally optional, and you can change it any time in Settings."
            >
              <div className="rounded-xl border bg-card p-4">
                <PushToggle />
              </div>
              <p className="text-xs text-muted-foreground">
                Prefer to decide later? Just tap <strong>All set</strong> — no
                notifications until you turn them on.
              </p>
            </Step>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className={cn(step === 0 && "invisible")}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!canNext || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              All set
            </Button>
          )}
        </div>

        {/* Install DailyOS — add it to the home screen while you're here */}
        <div className="mt-8 rounded-xl border border-primary/30 bg-accent/20 p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <p className="text-sm font-medium">Install DailyOS</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add it to your home screen — full-screen, offline, and a tap away.
          </p>
          <div className="mt-2">
            <InstallApp />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Choice({
  selected,
  onClick,
  icon: Icon,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  desc?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
        selected ? "border-2 border-primary bg-accent/50" : "hover:bg-accent",
      )}
    >
      <Icon className="size-6 shrink-0 text-muted-foreground" />
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {desc && <span className="block text-sm text-muted-foreground">{desc}</span>}
      </span>
      {selected && <Check className="size-5 text-primary" />}
    </button>
  );
}
