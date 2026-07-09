"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  StickyNote,
  Trash2,
  Pencil,
  Pin,
  Bell,
  Check,
  X,
} from "lucide-react";
import { createNote, deleteNote, updateNote } from "@/app/(app)/notes/actions";
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
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditDraft(n.content);
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return;
    setSavingEdit(true);
    const res = await updateNote(id, editDraft);
    setSavingEdit(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't update", description: res.error });
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? res.note : n)));
    setEditingId(null);
    toast({ variant: "success", title: "Note updated" });
  }

  const categories = React.useMemo(() => {
    const set = new Map<string, number>();
    for (const n of notes) set.set(n.category, (set.get(n.category) ?? 0) + 1);
    return Array.from(set.entries());
  }, [notes]);

  // Pinned notes (kept on this device) float to the top of the list.
  const [pinned, setPinned] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    try {
      setPinned(new Set(JSON.parse(localStorage.getItem("dailyos-pinned-notes") || "[]")));
    } catch {
      /* ignore */
    }
  }, []);
  function togglePin(id: string) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("dailyos-pinned-notes", JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const filtered = notes
    .filter((n) => {
      if (category !== "all" && n.category !== category) return false;
      if (query.trim() && !n.content.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => Number(pinned.has(b.id)) - Number(pinned.has(a.id)));

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
    // Offer a smart reminder if there's one.
    if (res.analysis.suggested_task) {
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
    const prevNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (suggestion?.noteId === id) setSuggestion(null);
    const res = await deleteNote(id);
    if (!res.ok) {
      // Put it back — the delete didn't actually happen.
      setNotes(prevNotes);
      toast({ variant: "error", title: "Couldn't delete note" });
    }
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
              {editingId === n.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      disabled={savingEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveEdit(n.id)}
                      disabled={savingEdit || !editDraft.trim()}
                    >
                      {savingEdit && <Loader2 className="size-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => togglePin(n.id)}
                        className={cn(
                          "transition-colors",
                          pinned.has(n.id)
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary",
                        )}
                        aria-label={pinned.has(n.id) ? "Unpin note" : "Pin note"}
                        title={pinned.has(n.id) ? "Unpin" : "Pin to top"}
                      >
                        <Pin
                          className={cn("size-4", pinned.has(n.id) && "fill-current")}
                        />
                      </button>
                      <button
                        onClick={() => startEdit(n)}
                        className="text-muted-foreground transition-colors hover:text-primary"
                        aria-label="Edit note"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => remove(n.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Delete note"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {n.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {relativeDay(n.created_at)}
                    </span>
                  </div>
                </>
              )}
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
