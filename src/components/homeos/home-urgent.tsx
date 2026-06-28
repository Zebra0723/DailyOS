"use client";

import * as React from "react";
import { AlertTriangle, Plus, Check, RotateCcw, Trash2 } from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Section, HomeEmpty } from "@/components/homeos/ui";
import { cn } from "@/lib/utils";

export function HomeUrgent() {
  const { data, addConcern, toggleConcern, deleteConcern } = useHomeOS();
  const [draft, setDraft] = React.useState("");

  const concerns = data.concerns ?? [];
  const open = concerns.filter((c) => !c.resolved);
  const done = concerns.filter((c) => c.resolved);

  function add() {
    if (!draft.trim()) return;
    addConcern(draft);
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <Section
        title="Urgent house concerns"
        description="Note anything wrong with the house. It'll nag you on the HomeOS home page every day until you mark it sorted."
      >
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="e.g. Mould on the bathroom ceiling, dripping tap…"
              />
              <Button onClick={add} disabled={!draft.trim()}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {open.length === 0 && done.length === 0 ? (
        <HomeEmpty message="No concerns logged. The house is in good shape. ✨" />
      ) : (
        <div className="space-y-2">
          {open.map((c) => (
            <Card key={c.id} className="border-amber-200 dark:border-amber-500/20">
              <CardContent className="flex items-center gap-3 p-3.5">
                <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 text-sm font-medium">{c.text}</span>
                <Button variant="outline" size="sm" onClick={() => toggleConcern(c.id)}>
                  <Check className="size-4" /> Sorted
                </Button>
                <button
                  onClick={() => deleteConcern(c.id)}
                  className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}

          {done.length > 0 && (
            <p className="px-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sorted
            </p>
          )}
          {done.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3 p-3.5">
                <Check className="size-4 shrink-0 text-emerald-500" />
                <span className={cn("min-w-0 flex-1 text-sm line-through opacity-60")}>
                  {c.text}
                </span>
                <Button variant="ghost" size="sm" onClick={() => toggleConcern(c.id)}>
                  <RotateCcw className="size-4" /> Reopen
                </Button>
                <button
                  onClick={() => deleteConcern(c.id)}
                  className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
