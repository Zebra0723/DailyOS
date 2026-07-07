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

// Reminder lead times, in minutes before the event start. null = no reminder.
const REMINDER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "No reminder", minutes: null },
  { label: "At start time", minutes: 0 },
  { label: "10 minutes before", minutes: 10 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
  { label: "2 hours before", minutes: 120 },
  { label: "1 day before", minutes: 1440 },
];
const KNOWN_MINUTES = REMINDER_OPTIONS.map((o) => o.minutes).filter(
  (m): m is number => m != null,
);

/** Absolute UTC instant to fire the reminder: the picked wall-clock start read
 *  in THIS device's real timezone, minus the lead time. null when off/invalid. */
function computeRemindAt(startLocal: string, minutes: number | null): string | null {
  if (minutes == null || !startLocal) return null;
  const startMs = new Date(startLocal).getTime(); // datetime-local → local instant
  if (!Number.isFinite(startMs)) return null;
  return new Date(startMs - minutes * 60_000).toISOString();
}

/** Recover which lead-time option a stored remind_at corresponds to, for edits. */
function deriveMinutes(
  startLocal: string,
  remindAt: string | null | undefined,
): number | null {
  if (!remindAt || !startLocal) return null;
  const startMs = new Date(startLocal).getTime();
  const remindMs = new Date(remindAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(remindMs)) return null;
  const diff = Math.round((startMs - remindMs) / 60_000);
  // Snap to the nearest known option so the dropdown shows a clean value.
  return KNOWN_MINUTES.reduce(
    (best, m) => (Math.abs(m - diff) < Math.abs(best - diff) ? m : best),
    KNOWN_MINUTES[0],
  );
}

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
  // New events default to a 30-min heads-up; edits keep whatever was set.
  const [remindMinutes, setRemindMinutes] = React.useState<number | null>(
    event
      ? deriveMinutes(storedToInput(event.start_time), event.remind_at)
      : 30,
  );
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
      // Absolute instant to notify — computed from the picked start in this
      // device's real timezone, so the reminder fires at the right moment.
      remind_at: computeRemindAt(start, remindMinutes),
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
            <Label htmlFor="ev-remind">Reminder</Label>
            <select
              id="ev-remind"
              value={remindMinutes == null ? "none" : String(remindMinutes)}
              onChange={(e) =>
                setRemindMinutes(
                  e.target.value === "none" ? null : Number(e.target.value),
                )
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {REMINDER_OPTIONS.map((o) => (
                <option
                  key={o.label}
                  value={o.minutes == null ? "none" : String(o.minutes)}
                >
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              We&apos;ll send a notification then — if you&apos;ve turned
              notifications on in Settings.
            </p>
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
