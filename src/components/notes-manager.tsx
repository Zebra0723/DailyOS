"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  StickyNote,
  Trash2,
  Bell,
  Flower2,
  Check,
  X,
} from "lucide-react";
import { createNote, deleteNote } from "@/app/(app)/notes/actions";
import { createTask } from "@/app/(app)/tasks/actions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate, relativeDay } from "@/lib/utils";
import type { Note, NoteAnalysis } from "@/lib/types";

interface Suggestion {
  noteId: string;
  analysis: NoteAnalysis;
}

export function NotesManager({ notes: initial }: { notes: Note[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [notes, setNotes] = React.useState<Note[]>(initial);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<Suggestion | null>(null);

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");

  const categories = React.useMemo(() => {
    const set = new Map<string, number>();
    for (const n of notes) set.set(n.category, (set.get(n.category) ?? 0) + 1);
    return Array.from(set.entries());
  }, [notes]);

  const filtered = notes.filter((n) => {
    if (category !== "all" && n.category !== category) return false;
    if (query.trim() && !n.content.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await createNote(draft);
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    setNotes((prev) => [res.note, ...prev]);
    setDraft("");
    // Offer a smart reminder / wellbeing nudge if there's one.
    if (res.analysis.suggested_task || res.analysis.wellbeing) {
      setSuggestion({ noteId: res.note.id, analysis: res.analysis });
    } else {
      setSuggestion(null);
      toast({ variant: "success", title: "Note saved", description: `Filed under ${res.note.category}` });
    }
  }

  async function confirmReminder() {
    if (!suggestion?.analysis.suggested_task) return;
    const t = suggestion.analysis.suggested_task;
    const res = await createTask({
      title: t.title,
      description: "From a note",
      due_date: t.due_date,
      priority: t.priority,
    });
    if (res.ok) {
      toast({ variant: "success", title: "Reminder added", description: t.title });
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't add reminder" });
    }
    setSuggestion(null);
  }

  async function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (suggestion?.noteId === id) setSuggestion(null);
    await deleteNote(id);
  }

  return (
    <div className="space-y-5">
      {/* Composer */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <Textarea
            placeholder="Jot anything — “dentist next Tuesday 3pm”, “renew car insurance”, “so much on today”…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[88px]"
          />
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || !draft.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart suggestion (one tap to confirm; always asks) */}
      {suggestion?.analysis.suggested_task && (
        <Card className="border-primary/30 bg-accent/40">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Add a reminder for this?</p>
                <p className="text-sm text-muted-foreground">
                  {suggestion.analysis.suggested_task.title}
                  {suggestion.analysis.suggested_task.due_date
                    ? ` · ${formatDate(suggestion.analysis.suggested_task.due_date)}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                <X className="size-4" /> No thanks
              </Button>
              <Button size="sm" onClick={confirmReminder}>
                <Check className="size-4" /> Add reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wellbeing nudge */}
      {suggestion?.analysis.wellbeing && !suggestion.analysis.suggested_task && (
        <Card className="border-primary/20 bg-accent/40">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Flower2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Sounds like a lot on.</p>
                <p className="text-sm text-muted-foreground">
                  Take a minute for yourself with today&apos;s mindful moment.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
                Later
              </Button>
              <Button size="sm" asChild>
                <Link href="/mindfulness">
                  <Flower2 className="size-4" /> Take a moment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + filter */}
      {notes.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={category === "all"} onClick={() => setCategory("all")} label="All" count={notes.length} />
            {categories.map(([cat, count]) => (
              <Chip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
                label={cat}
                count={count}
              />
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Write your first quick note above. DailyOS files it by category and offers a reminder when it spots something to do."
        />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing matches that.
        </p>
      ) : (
        <div className="grid gap-2">
          {filtered.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                <button
                  onClick={() => remove(n.id)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {n.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {relativeDay(n.created_at)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-primary-foreground/20" : "bg-muted")}>
        {count}
      </span>
    </button>
  );
}
