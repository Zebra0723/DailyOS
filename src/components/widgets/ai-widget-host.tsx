"use client";

// Loads one AI-built widget's spec and state, renders it, and persists edits.
// Kept separate from the renderer so the builder preview can reuse AIWidget
// without any of this I/O.

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { debounce } from "@/lib/sync";
import {
  loadSpecs, loadSpecsLocal, loadWidgetState, loadWidgetStateLocal, saveWidgetState,
} from "@/lib/widgets/ai-store";
import type { WidgetSpec } from "@/lib/widgets/spec";
import type { WidgetState } from "@/lib/widgets/state";
import { AIWidget } from "./ai-widget";

/** Fired after a widget is built or deleted so open dashboards re-read. */
export const AI_WIDGETS_EVENT = "dailyos-ai-widgets";

export function AIWidgetHost({
  widgetId,
  userId,
  onRemove,
}: {
  widgetId: string;
  userId?: string;
  onRemove?: () => void;
}) {
  const [spec, setSpec] = React.useState<WidgetSpec | null>(null);
  const [state, setState] = React.useState<WidgetState | null>(null);
  const [missing, setMissing] = React.useState(false);

  const push = React.useMemo(
    () =>
      debounce(
        (id: string, next: WidgetState, uid?: string) => void saveWidgetState(id, next, uid),
        600,
      ),
    [],
  );

  const load = React.useCallback(async () => {
    // Paint from the device first so the widget doesn't flash empty.
    const localSpec = loadSpecsLocal(userId).find((s) => s.id === widgetId) ?? null;
    if (localSpec) {
      setSpec(localSpec);
      setState(loadWidgetStateLocal(localSpec, userId));
    }

    const remoteSpec = (await loadSpecs(userId)).find((s) => s.id === widgetId) ?? null;
    if (!remoteSpec) {
      setMissing(!localSpec);
      return;
    }
    setSpec(remoteSpec);
    setState(await loadWidgetState(remoteSpec, userId));
    setMissing(false);
  }, [widgetId, userId]);

  React.useEffect(() => {
    void load();
    const onChanged = () => void load();
    window.addEventListener(AI_WIDGETS_EVENT, onChanged);
    return () => window.removeEventListener(AI_WIDGETS_EVENT, onChanged);
  }, [load]);

  const handleChange = React.useCallback(
    (next: WidgetState) => {
      setState(next);
      push(widgetId, next, userId);
    },
    [push, widgetId, userId],
  );

  if (missing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Sparkles className="size-6 text-muted-foreground/40" />
          <p className="text-sm font-medium">This widget is no longer available</p>
          <p className="text-xs text-muted-foreground">
            It may have been deleted on another device. Remove it from your dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!spec || !state) {
    return (
      <Card>
        <CardContent className="grid place-items-center py-12">
          <Sparkles className="size-5 animate-pulse text-muted-foreground/40" />
        </CardContent>
      </Card>
    );
  }

  return <AIWidget spec={spec} state={state} onChange={handleChange} onRemove={onRemove} />;
}
