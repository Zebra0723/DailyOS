"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  DailyOS-branded date & time pickers.                                      */
/*                                                                            */
/*  Drop-in replacements for <input type="date|time|datetime-local">. They    */
/*  read and emit the SAME string formats the native inputs use, so every     */
/*  surrounding bit of logic keeps working unchanged:                         */
/*    • DatePicker      → "yyyy-mm-dd"                                         */
/*    • TimePicker      → "HH:mm"  (24h)                                       */
/*    • DateTimePicker  → "yyyy-mm-ddThh:mm"                                   */
/*                                                                            */
/*  onChange receives the string value directly (not a DOM event).            */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]; // UK: week starts Monday

const pad = (n: number) => String(n).padStart(2, "0");

type YMD = { y: number; m: number; d: number };
type HM = { h: number; min: number };

function parseDate(v?: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? "");
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}
function parseTime(v?: string): HM | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(v ?? "");
  return m ? { h: +m[1], min: +m[2] } : null;
}
const fmtDate = (p: YMD) => `${p.y}-${pad(p.m)}-${pad(p.d)}`;
const fmtTime = (t: HM) => `${pad(t.h)}:${pad(t.min)}`;

function displayDate(p: YMD): string {
  return new Date(p.y, p.m - 1, p.d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function displayTime(t: HM): string {
  const ampm = t.h < 12 ? "AM" : "PM";
  const h12 = t.h % 12 || 12;
  return `${h12}:${pad(t.min)} ${ampm}`;
}

const to24 = (h12: number, ampm: "AM" | "PM") =>
  ampm === "AM" ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;

/* ------------------------------ Trigger field ----------------------------- */

const TriggerField = React.forwardRef<
  HTMLButtonElement,
  {
    id?: string;
    icon: React.ComponentType<{ className?: string }>;
    text: string;
    empty: boolean;
    className?: string;
    onClick: () => void;
  }
>(function TriggerField({ id, icon: Icon, text, empty, className, onClick }, ref) {
  return (
    <button
      ref={ref}
      id={id}
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("truncate", empty && "text-muted-foreground")}>
        {text}
      </span>
    </button>
  );
});

/* -------------------------------- Modal shell ----------------------------- */

function PickerModal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4 backdrop-blur-[1px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[20rem] overflow-hidden rounded-2xl border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Calendar -------------------------------- */

function Calendar({
  selected,
  onPick,
}: {
  selected: YMD | null;
  onPick: (p: YMD) => void;
}) {
  const today = new Date();
  const [view, setView] = React.useState(() =>
    selected
      ? { y: selected.y, m: selected.m }
      : { y: today.getFullYear(), m: today.getMonth() + 1 },
  );

  const shift = (delta: number) =>
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 1) {
        m = 12;
        y--;
      } else if (m > 12) {
        m = 1;
        y++;
      }
      return { y, m };
    });

  const first = new Date(view.y, view.m - 1, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-based
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    view.y === today.getFullYear() &&
    view.m === today.getMonth() + 1 &&
    d === today.getDate();
  const isSelected = (d: number) =>
    selected != null &&
    selected.y === view.y &&
    selected.m === view.m &&
    selected.d === d;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-sm font-semibold">
          {MONTHS[view.m - 1]} {view.y}
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="grid h-7 place-items-center text-[11px] font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) =>
          d == null ? (
            <div key={`b${i}`} className="size-9" />
          ) : (
            <button
              key={d}
              type="button"
              onClick={() => onPick({ y: view.y, m: view.m, d })}
              className={cn(
                "grid size-9 place-items-center rounded-lg text-sm transition-colors",
                isSelected(d)
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isToday(d)
                    ? "font-semibold text-primary ring-1 ring-inset ring-primary/40 hover:bg-accent"
                    : "hover:bg-accent",
              )}
            >
              {d}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Time columns ----------------------------- */

function ScrollColumn({
  items,
  selected,
  format,
  onSelect,
}: {
  items: number[];
  selected: number;
  format: (n: number) => string;
  onSelect: (n: number) => void;
}) {
  const selRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    selRef.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div className="h-48 flex-1 overflow-y-auto rounded-lg border bg-background p-1">
      {items.map((n) => {
        const active = n === selected;
        return (
          <button
            key={n}
            ref={active ? selRef : undefined}
            type="button"
            onClick={() => onSelect(n)}
            className={cn(
              "block w-full rounded-md py-1.5 text-center text-sm transition-colors",
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {format(n)}
          </button>
        );
      })}
    </div>
  );
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function TimeColumns({
  value,
  onChange,
}: {
  value: HM;
  onChange: (v: HM) => void;
}) {
  const ampm: "AM" | "PM" = value.h < 12 ? "AM" : "PM";
  const h12 = value.h % 12 || 12;
  return (
    <div className="flex items-stretch gap-2">
      <ScrollColumn
        items={HOURS_12}
        selected={h12}
        format={(n) => String(n)}
        onSelect={(n) => onChange({ h: to24(n, ampm), min: value.min })}
      />
      <ScrollColumn
        items={MINUTES}
        selected={value.min}
        format={pad}
        onSelect={(n) => onChange({ h: value.h, min: n })}
      />
      <div className="flex w-14 flex-col gap-1">
        {(["AM", "PM"] as const).map((ap) => (
          <button
            key={ap}
            type="button"
            onClick={() => onChange({ h: to24(h12, ap), min: value.min })}
            className={cn(
              "flex-1 rounded-lg border text-sm font-semibold transition-colors",
              ampm === ap
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {ap}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public components                                                         */
/* -------------------------------------------------------------------------- */

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Select a date",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseDate(value);
  return (
    <>
      <TriggerField
        id={id}
        icon={CalendarIcon}
        text={parsed ? displayDate(parsed) : placeholder}
        empty={!parsed}
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && (
        <PickerModal
          title="Select date"
          onClose={() => setOpen(false)}
          footer={
            <>
              {value ? (
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const n = new Date();
                  onChange(
                    fmtDate({
                      y: n.getFullYear(),
                      m: n.getMonth() + 1,
                      d: n.getDate(),
                    }),
                  );
                  setOpen(false);
                }}
              >
                Today
              </Button>
            </>
          }
        >
          <Calendar
            selected={parsed}
            onPick={(p) => {
              onChange(fmtDate(p));
              setOpen(false);
            }}
          />
        </PickerModal>
      )}
    </>
  );
}

export function TimePicker({
  value,
  onChange,
  id,
  placeholder = "Select a time",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseTime(value);
  const [draft, setDraft] = React.useState<HM>(parsed ?? { h: 9, min: 0 });

  const openPicker = () => {
    setDraft(parseTime(value) ?? { h: 9, min: 0 });
    setOpen(true);
  };

  return (
    <>
      <TriggerField
        id={id}
        icon={Clock}
        text={parsed ? displayTime(parsed) : placeholder}
        empty={!parsed}
        className={className}
        onClick={openPicker}
      />
      {open && (
        <PickerModal
          title="Select time"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onChange(fmtTime(draft));
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </>
          }
        >
          <TimeColumns value={draft} onChange={setDraft} />
        </PickerModal>
      )}
    </>
  );
}

export function DateTimePicker({
  value,
  onChange,
  id,
  placeholder = "Select date & time",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [datePart, timePart] = (value ?? "").split("T");
  const parsedDate = parseDate(datePart);
  const parsedTime = parseTime(timePart);

  const [draftDate, setDraftDate] = React.useState<YMD | null>(parsedDate);
  const [draftTime, setDraftTime] = React.useState<HM>(parsedTime ?? { h: 9, min: 0 });

  const openPicker = () => {
    const [dp, tp] = (value ?? "").split("T");
    setDraftDate(parseDate(dp));
    setDraftTime(parseTime(tp) ?? { h: 9, min: 0 });
    setOpen(true);
  };

  const label =
    parsedDate && parsedTime
      ? `${displayDate(parsedDate)}, ${displayTime(parsedTime)}`
      : parsedDate
        ? displayDate(parsedDate)
        : placeholder;

  return (
    <>
      <TriggerField
        id={id}
        icon={CalendarIcon}
        text={label}
        empty={!parsedDate}
        className={className}
        onClick={openPicker}
      />
      {open && (
        <PickerModal
          title="Select date & time"
          onClose={() => setOpen(false)}
          footer={
            <>
              {value ? (
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              <Button
                size="sm"
                disabled={!draftDate}
                onClick={() => {
                  if (!draftDate) return;
                  onChange(`${fmtDate(draftDate)}T${fmtTime(draftTime)}`);
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Calendar selected={draftDate} onPick={setDraftDate} />
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Time
              </p>
              <TimeColumns value={draftTime} onChange={setDraftTime} />
            </div>
          </div>
        </PickerModal>
      )}
    </>
  );
}
