"use client";

// ----------------------------------------------------------------------------
// The AI Feature Builder.
//
// Describe a feature → the model returns a declarative widget spec → the user
// previews the real, working widget before deciding to keep it. Saving adds it
// to the dashboard alongside the built-in widgets.
// ----------------------------------------------------------------------------

import * as React from "react";
import { Sparkles, Loader2, Wand2, Check, RotateCcw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { buildFeatureAction } from "@/app/(app)/today/feature-builder-actions";
import { addSpec, dashboardIdFor, loadSpecs } from "@/lib/widgets/ai-store";
import { emptyState, type WidgetState } from "@/lib/widgets/state";
import type { WidgetSpec } from "@/lib/widgets/spec";
import { AIWidget } from "./ai-widget";
import { AI_WIDGETS_EVENT } from "./ai-widget-host";

const EXAMPLES = [
  "A gym tracker — 4 sessions a week, and how each one felt",
  "A reading list with pages read each day",
  "A meal planner for the week plus a shopping list",
  "Days until my holiday, with a packing list",
];

export function AIBuilderWidget({
  userId,
  onAdded,
}: {
  userId?: string;
  /** Lets the dashboard drop the new widget straight onto the grid. */
  onAdded?: (dashboardId: string) => void;
}) {
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState("");
  const [building, setBuilding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<WidgetSpec | null>(null);
  const [preview, setPreview] = React.useState<WidgetState | null>(null);

  async function build() {
    const description = prompt.trim();
    if (!description || building) return;

    setBuilding(true);
    setError(null);
    setDraft(null);
    setPreview(null);

    try {
      const existing = await loadSpecs(userId);
      const res = await buildFeatureAction(description, existing.map((s) => s.id));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft(res.spec);
      setPreview(emptyState(res.spec));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBuilding(false);
    }
  }

  async function keep() {
    if (!draft || saving) return;
    setSaving(true);
    try {
      await addSpec(draft, userId);
      // Tell any mounted AI widgets to re-read before the dashboard adds this one.
      window.dispatchEvent(new Event(AI_WIDGETS_EVENT));
      onAdded?.(dashboardIdFor(draft.id));
      toast({ variant: "success", title: `"${draft.title}" added to your dashboard` });
      setDraft(null);
      setPreview(null);
      setPrompt("");
    } catch {
      toast({ variant: "error", title: "Couldn't save that widget. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
            AI Feature Builder
          </span>
          <span className="rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Pro
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {!draft && (
          <>
            <p className="text-sm text-muted-foreground">
              Describe what you want to track and DailyOS will build it. Track anything — your way.
            </p>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                // Enter builds; Shift+Enter is a newline.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void build();
                }
              }}
              placeholder="e.g. A habit tracker for my morning routine, with a streak"
              rows={2}
              maxLength={600}
              disabled={building}
              className="resize-none text-sm"
            />

            <Button
              onClick={build}
              disabled={building || !prompt.trim()}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700"
            >
              {building ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Building…
                </>
              ) : (
                <>
                  <Wand2 className="size-4" /> Build my feature
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}

            {!building && !error && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="flex items-start gap-1.5 rounded-lg border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    <Wand2 className="mt-0.5 size-3 shrink-0" /> {example}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {draft && preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">Here&apos;s what I built — try it out.</p>
            </div>

            {/* The real widget, fully interactive, but nothing is saved yet. */}
            <div className="rounded-xl border bg-background p-1">
              <AIWidget spec={draft} state={preview} onChange={setPreview} />
            </div>

            <div className="flex gap-2">
              <Button onClick={keep} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Adding…
                  </>
                ) : (
                  <>
                    <Check className="size-4" /> Add to dashboard
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={build} disabled={building || saving}>
                {building ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                Try again
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(null);
                  setPreview(null);
                }}
                disabled={saving}
              >
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
