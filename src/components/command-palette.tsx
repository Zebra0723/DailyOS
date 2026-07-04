"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sun,
  Inbox,
  Plus,
  CalendarClock,
  Heart,
  Globe,
  StickyNote,
  Calendar,
  CheckSquare,
  Archive,
  Home,
  Flower2,
  SmilePlus,
  ListChecks,
  Settings,
  CornerDownLeft,
} from "lucide-react";

export const OPEN_COMMAND_EVENT = "dailyos-open-command";

type Cmd = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
};

const COMMANDS: Cmd[] = [
  { label: "Add to Inbox", href: "/inbox/new", icon: Plus, keywords: "new capture receipt upload" },
  { label: "Today", href: "/today", icon: Sun, keywords: "home dashboard brief" },
  { label: "Inbox", href: "/inbox", icon: Inbox, keywords: "life inbox items" },
  { label: "Build My Day", href: "/build-day", icon: CalendarClock, keywords: "plan schedule" },
  { label: "Interests", href: "/interests", icon: Heart, keywords: "hobbies" },
  { label: "World Clock", href: "/world-clock", icon: Globe, keywords: "time zones cities" },
  { label: "Notes", href: "/notes", icon: StickyNote, keywords: "write" },
  { label: "Calendar", href: "/calendar", icon: Calendar, keywords: "events month" },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, keywords: "todo" },
  { label: "Vault", href: "/vault", icon: Archive, keywords: "files documents" },
  { label: "HomeOS", href: "/homeos", icon: Home, keywords: "home subscriptions devices rooms" },
  { label: "Mindfulness", href: "/mindfulness", icon: Flower2, keywords: "calm breathe wellbeing" },
  { label: "Mood", href: "/mood", icon: SmilePlus, keywords: "feeling wellbeing" },
  { label: "Nudges", href: "/nudges", icon: ListChecks, keywords: "habits wellbeing" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "account plan billing" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords?.toLowerCase().includes(q),
    );
  }, [query]);

  React.useEffect(() => {
    setActive(0);
  }, [query, open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      // Focus after the panel mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item.href);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-foreground/30 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-popover shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search DailyOS…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.href}
                onClick={() => go(c.href)}
                onMouseEnter={() => setActive(i)}
                className={
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm " +
                  (i === active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground")
                }
              >
                <c.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{c.label}</span>
                {i === active && (
                  <CornerDownLeft className="size-3.5 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
