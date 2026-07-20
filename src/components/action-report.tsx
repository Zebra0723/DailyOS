"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Quote,
  Bell,
  Loader2,
  CalendarClock,
  Plus,
} from "lucide-react";
import { createTask } from "@/app/(app)/tasks/actions";
import { ITEM_TYPE_LABELS, type ExtractionResult, type InboxItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";

function ConfidenceBadge({ value }: { value: ExtractionResult["confidence"] }) {
  const map = {
    high: { label: "High confidence", variant: "success" as const },
    medium: { label: "Medium confidence", variant: "warning" as const },
    low: { label: "Low confidence", variant: "secondary" as const },
  };
  const c = map[value] ?? map.medium;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export function ItemOverview({ ai }: { ai: ExtractionResult }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">
            {ITEM_TYPE_LABELS[ai.item_type] ?? ai.item_type}
          </Badge>
          <ConfidenceBadge value={ai.confidence} />
          {ai.main_date && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {formatDate(ai.main_date)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[15px] leading-relaxed">{ai.summary}</p>
      </CardContent>
    </Card>
  );
}

function DetailGroup({ label, values }: { label: string; values: string[] }) {
  if (!values?.length) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="rounded-md bg-muted px-2 py-1 text-sm">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ImportantDetails({ ai }: { ai: ExtractionResult }) {
  const dateChips = (ai.key_dates ?? []).map((d) =>
    [formatDate(d.date), d.time].filter(Boolean).join(" · "),
  );
  const e = ai.entities;
  const groups: { label: string; values: string[] }[] = [
    { label: "Dates & times", values: dateChips },
    { label: "Deadlines", values: e.deadlines },
    { label: "People", values: e.people },
    { label: "Companies", values: e.companies },
    { label: "Places", values: e.places },
    { label: "Prices", values: e.prices },
    { label: "Order numbers", values: e.order_numbers },
    { label: "Booking numbers", values: e.booking_numbers },
    { label: "Reference numbers", values: e.reference_numbers },
  ].filter((g) => g.values?.length);

  if (!groups.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Important details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <DetailGroup key={g.label} label={g.label} values={g.values} />
        ))}
      </CardContent>
    </Card>
  );
}

export function WatchOuts({ ai }: { ai: ExtractionResult }) {
  if (!ai.watch_outs?.length) return null;
  return (
    <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-4 text-amber-500" /> Watch-outs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ai.watch_outs.map((w, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <div>
              <p className="text-sm font-medium">{w.title}</p>
              {w.detail && (
                <p className="text-sm text-muted-foreground">{w.detail}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SourceProof({ ai }: { ai: ExtractionResult }) {
  if (!ai.source_snippets?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Quote className="size-4 text-primary" /> Source proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ai.source_snippets.map((s, i) => (
          <div key={i} className="rounded-lg border-l-2 border-primary/40 bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-sm italic">“{s.snippet}”</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const OFFSETS = [
  { label: "Same day", days: 0 },
  { label: "1 day before", days: 1 },
  { label: "3 days before", days: 3 },
  { label: "1 week before", days: 7 },
];

function shiftDate(isoDate: string, daysBefore: number): string | null {
  const d = new Date(`${isoDate}T09:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

export function ReminderSuggestions({
  item,
  ai,
}: {
  item: InboxItem;
  ai: ExtractionResult;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [custom, setCustom] = React.useState("");

  const baseDate = ai.main_date ?? ai.key_dates?.[0]?.date ?? null;
  // Only show date-relative options when we actually have a date.
  if (!baseDate) return null;

  async function addReminder(label: string, dueDate: string | null) {
    if (!dueDate) return;
    setBusy(label);
    const res = await createTask({
      title: `Reminder: ${item.title}`.slice(0, 90),
      description: `${label} — for ${formatDate(baseDate!)}`,
      due_date: dueDate,
      priority: "medium",
    });
    setBusy(null);
    if (res.ok) {
      toast({ variant: "success", title: "Reminder added", description: `${label} (${formatDate(dueDate)})` });
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't add reminder" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" /> Reminder suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Based on {formatDate(baseDate)}. Adding one creates a task on that day.
        </p>
        <div className="flex flex-wrap gap-2">
          {OFFSETS.map((o) => {
            const d = shiftDate(baseDate, o.days);
            return (
              <Button
                key={o.label}
                variant="outline"
                size="sm"
                disabled={busy !== null || !d}
                onClick={() => addReminder(o.label, d)}
              >
                {busy === o.label ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {o.label}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <DatePicker
            value={custom}
            onChange={setCustom}
            className="max-w-[180px]"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null || !custom}
            onClick={() => addReminder("Custom", custom)}
          >
            Add custom
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
