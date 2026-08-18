"use client";

// The Customise screen for app sections: switch a feature on and it appears in
// the nav immediately; switch it off and it goes away. This is the visible half
// of the empty-first brief — before it existed, the nav showed everything to
// everyone and toggling anything left no trace.

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { useFeatures } from "@/lib/features-store";
import { TOGGLEABLE_FEATURES, type FeatureCategory } from "@/lib/features";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GROUP_ORDER: FeatureCategory[] = ["LifeOS", "HomeOS", "Account"];

export function FeatureManager() {
  const { enabled, loaded, setEnabled } = useFeatures();

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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your sections</CardTitle>
        <CardDescription>
          {loaded
            ? `Pick what DailyOS shows you. ${onCount} of ${TOGGLEABLE_FEATURES.length} on — the rest stay out of your way until you want them.`
            : "Loading your sections…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!loaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.category}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((f) => {
                  const on = enabled.has(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      onClick={() => setEnabled(f.key, !on)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        on
                          ? "border-primary/40 bg-primary/5"
                          : "hover:bg-accent/30",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {on && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{f.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {f.description}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium",
                          on ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {on ? "Added" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
