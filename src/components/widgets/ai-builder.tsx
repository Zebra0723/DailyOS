"use client";

import * as React from "react";
import { Sparkles, ArrowRight, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AIBuilderWidget() {
  const [prompt, setPrompt] = React.useState("");
  const [building, setBuilding] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function build() {
    if (!prompt.trim()) return;
    setBuilding(true);
    setResult(null);
    // Simulate AI processing — the real implementation will use the AI assistant
    await new Promise((r) => setTimeout(r, 2000));
    setResult(`Custom widget "${prompt.trim()}" is being designed. This feature is coming soon — the AI will generate a fully functional custom widget based on your description.`);
    setBuilding(false);
  }

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader>
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
        <p className="text-sm text-muted-foreground">
          Describe a feature and DailyOS will build it for you. Track anything — your way.
        </p>
        <div className="space-y-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A meal planner with weekly recipes..."
            onKeyDown={(e) => { if (e.key === "Enter") build(); }}
          />
          <Button onClick={build} disabled={building || !prompt.trim()} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700">
            {building ? (
              <><Loader2 className="size-4 animate-spin" /> Building...</>
            ) : (
              <><Wand2 className="size-4" /> Build my feature</>
            )}
          </Button>
        </div>
        {result && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-sm text-muted-foreground">{result}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {["Meal planner", "Reading list", "Fitness log", "Budget tracker"].map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <Wand2 className="size-3" /> {s}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
