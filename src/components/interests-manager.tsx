"use client";

import * as React from "react";
import {
  Plus,
  X,
  Sparkles,
  Loader2,
  Heart,
  Lightbulb,
} from "lucide-react";
import { getInterestIdeas } from "@/app/(app)/interests/actions";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Interest {
  id: string;
  text: string;
  intro?: string;
  suggestions?: string[];
  usedAI?: boolean;
}

// Split "Today: do a drill" into a label chip + the rest.
const LABELS = ["Today", "This week", "Go deeper", "Level up", "Community", "Spend wisely"];
function splitSuggestion(s: string): { label?: string; text: string } {
  const idx = s.indexOf(":");
  if (idx > 0) {
    const label = s.slice(0, idx).trim();
    if (LABELS.includes(label)) return { label, text: s.slice(idx + 1).trim() };
  }
  return { text: s };
}

const keyFor = (userId: string) => `dailyos-interests:${userId}`;
// Cross-device sync key (scoped to the user server-side by RLS).
const SYNC_KEY = "interests-v1";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

export function InterestsManager({ userId }: { userId: string }) {
  const key = keyFor(userId);
  const [items, setItems] = React.useState<Interest[] | null>(null);
  const [draft, setDraft] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const hydratedRef = React.useRef(false);
  const pushRemote = React.useMemo(
    () => debounce((v: Interest[]) => void saveRemote(SYNC_KEY, v), 800),
    [],
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      // Instant paint from local storage.
      let local: Interest[] = [];
      try {
        const raw = localStorage.getItem(key);
        local = raw ? (JSON.parse(raw) as Interest[]) : [];
      } catch {
        local = [];
      }
      if (!active) return;
      setItems(local);

      // Cross-device pull (best-effort): remote wins if present, else seed it.
      const remote = await loadRemote<Interest[]>(SYNC_KEY);
      if (!active) return;
      if (Array.isArray(remote)) {
        setItems(remote);
        try {
          localStorage.setItem(key, JSON.stringify(remote));
        } catch {
          /* ignore */
        }
      } else if (local.length > 0) {
        void saveRemote(SYNC_KEY, local);
      }
      hydratedRef.current = true;
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: Interest[]) {
    setItems(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    if (hydratedRef.current) pushRemote(next);
  }

  function add() {
    const text = draft.trim();
    if (!text || !items) return;
    setDraft("");
    persist([{ id: uid(), text }, ...items]);
  }

  function remove(id: string) {
    if (!items) return;
    persist(items.filter((i) => i.id !== id));
  }

  async function getIdeas(it: Interest) {
    if (!items) return;
    setError(null);
    setBusyId(it.id);
    try {
      const res = await getInterestIdeas(it.text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      persist(
        items.map((x) =>
          x.id === it.id
            ? {
                ...x,
                intro: res.ideas.intro,
                suggestions: res.ideas.suggestions,
                usedAI: res.ideas.usedAI,
              }
            : x,
        ),
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Interests"
        description="Tell DailyOS what you're into, and it'll suggest ways to bring it into your life — from quick wins to bigger moves."
      />

      {/* Add */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. Patek Philippe watches, tennis, jazz piano…"
            />
            <Button onClick={add} disabled={!draft.trim()}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* List */}
      {items === null ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Heart className="size-6 text-primary" />
            Add your first interest above to get ideas for living it.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-medium">
                    <Heart className="size-4 text-primary" /> {it.text}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => getIdeas(it)}
                      disabled={busyId === it.id}
                    >
                      {busyId === it.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {it.suggestions ? "Refresh ideas" : "Get ideas"}
                    </Button>
                    <button
                      onClick={() => remove(it.id)}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Remove interest"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                {it.intro && (
                  <p className="mt-3 text-sm italic text-muted-foreground">
                    {it.intro}
                  </p>
                )}

                {it.suggestions && it.suggestions.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {it.suggestions.map((s, i) => {
                      const { label, text } = splitSuggestion(s);
                      return (
                        <li
                          key={i}
                          className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm"
                        >
                          {label ? (
                            <span className="mt-0.5 inline-flex shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              {label}
                            </span>
                          ) : (
                            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <span className="flex-1">{text}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {it.suggestions && it.usedAI === false && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Built-in plan. Connect an AI key for suggestions tailored to
                    your exact interest.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
