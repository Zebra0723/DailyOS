"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/app/(app)/calendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { wallClockToStored, storedToInput } from "@/lib/dates-tz";
import type { CalendarEvent } from "@/lib/types";

export function EventDialog({
  event,
  defaultDate,
  onClose,
}: {
  event: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(event);

  const [title, setTitle] = React.useState(event?.title ?? "");
  const [start, setStart] = React.useState(
    storedToInput(event?.start_time) ||
      (defaultDate ? `${defaultDate}T09:00` : ""),
  );
  const [end, setEnd] = React.useState(storedToInput(event?.end_time));
  const [location, setLocation] = React.useState(event?.location ?? "");
  const [description, setDescription] = React.useState(event?.description ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    if (!title.trim()) return setError("Give your event a title.");
    if (!start) return setError("Choose a start time.");
    setError(null);
    setBusy(true);

    const payload = {
      title,
      description: description || null,
      // Store the wall-clock you picked as a floating time, so it never shifts
      // when you (or anyone) view it from another timezone.
      start_time: wallClockToStored(start),
      end_time: end ? wallClockToStored(end) : null,
      location: location || null,
    };

    const res = event
      ? await updateEvent(event.id, payload)
      : await createEvent(payload);

    setBusy(false);
    if (!res.ok) return setError(res.error);
    toast({ variant: "success", title: editing ? "Event updated" : "Event added" });
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!event) return;
    if (!confirm("Delete this event?")) return;
    setBusy(true);
    const res = await deleteEvent(event.id);
    setBusy(false);
    if (res.ok) {
      toast({ variant: "success", title: "Event deleted" });
      router.refresh();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit event" : "New event"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dentist appointment"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-start">Starts</Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-end">Ends (optional)</Label>
              <Input
                id="ev-end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-loc">Location (optional)</Label>
            <Input
              id="ev-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-desc">Notes (optional)</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {editing ? (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={remove}
                disabled={busy}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={save} disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {editing ? "Save" : "Add event"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
