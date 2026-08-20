"use client";

// The Customise screen for app sections: switch one on and it appears in the
// nav immediately; switch it off and it goes. Adding and removing are both
// explicit here — an earlier version showed only a tick, which read as
// one-way and left people with no obvious way to take a section back off.

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Plus, X, LayoutGrid, Compass } from "lucide-react";
import { useFeatures } from "@/lib/features-store";
import {
  TOGGLEABLE_FEATURES,
  FEATURE_PACKS,
  isPackApplied,
  type FeatureCategory,
} from "@/lib/features";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GROUP_ORDER: FeatureCategory[] = ["LifeOS", "HomeOS", "Account"];

export function FeatureManager() {
  const { enabled, loaded, setEnabled, addPack } = useFeatures();

  const groups = React.useMemo(
    () =>
      GROUP_ORDER.map((category) => ({
        category,
        items: TOGGLEABLE_FEATURES.filter((f) => f.category === category),
      })).filter((g) => g.items.length > 0),
    [],
  );

  const onCount = TOGGLEABLE_FEATURES.filter((f) => enabled.has(f.key)).length;

  return (
    <Card id="sections">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="size-4 text-primary" /> Your sections
        </CardTitle>
        <CardDescription>
          DailyOS starts empty on purpose — you switch on the parts you want and
          leave the rest out of the way. Sections you add appear in the top
          navigation straight away; remove one and it disappears again. Nothing
          is deleted when you remove a section, it&apos;s just hidden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!loaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{onCount}</span> of{" "}
              {TOGGLEABLE_FEATURES.length} sections on.{" "}
              <Link href="/today" className="text-primary underline underline-offset-2">
                Today
              </Link>
              , Subscription and Settings are always available.
            </p>

            {/* Packs first: picking a purpose beats reasoning about a dozen
                individual toggles when you're starting from empty. */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Packs
              </p>
              <p className="text-xs text-muted-foreground">
                Switch on a set of sections for one job. Packs only ever add —
                they never remove something you&apos;ve already chosen.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FEATURE_PACKS.map((pack) => {
                  const applied = isPackApplied(enabled, pack.key);
                  return (
                    <div
                      key={pack.key}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border p-3",
                        applied ? "border-primary/40 bg-primary/5" : "bg-card",
                      )}
                    >
                      <div>
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {pack.name}
                          {applied && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                              <Check className="size-3" /> Added
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{pack.tagline}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          {pack.features
                            .map((k) => TOGGLEABLE_FEATURES.find((f) => f.key === k)?.label ?? k)
                            .join(" · ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={applied}
                        onClick={() => addPack(pack.key)}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          applied
                            ? "cursor-default border-input text-muted-foreground"
                            : "border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {applied ? (
                          <>
                            <Check className="size-3.5" /> Already added
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5" /> Add {pack.name}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {groups.map((group) => (
              <div key={group.category} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.category}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((f) => {
                    const on = enabled.has(f.key);
                    return (
                      <div
                        key={f.key}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                          on ? "border-primary/40 bg-primary/5" : "bg-card",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-medium">
                            {f.label}
                            {on && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                <Check className="size-3" /> Added
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{f.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnabled(f.key, !on)}
                          aria-label={on ? `Remove ${f.label}` : `Add ${f.label}`}
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                            on
                              ? "border-input text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                              : "border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          {on ? (
                            <>
                              <X className="size-3.5" /> Remove
                            </>
                          ) : (
                            <>
                              <Plus className="size-3.5" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <LayoutGrid className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Sections are the pages in your navigation. The cards on your Today
                dashboard are <strong>widgets</strong> — add or remove those from{" "}
                <Link href="/today" className="text-primary underline underline-offset-2">
                  Today
                </Link>{" "}
                using the Customise and Add widget buttons.
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
