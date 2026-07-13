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
  Wind,
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
  Loader2,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const OPEN_COMMAND_EVENT = "dailyos-open-command";

type Icon = React.ComponentType<{ className?: string }>;
type Item = { id: string; label: string; sub: string; href: string; icon: Icon };

const PAGES: Item[] = [
  { id: "p-add", label: "Add to the Drop", sub: "Page", href: "/inbox/new", icon: Plus },
  { id: "p-today", label: "Today", sub: "Page", href: "/today", icon: Sun },
  { id: "p-ask", label: "Ask DailyOS", sub: "Page", href: "/assistant", icon: Sparkles },
  { id: "p-inbox", label: "The Drop", sub: "Page", href: "/inbox", icon: Inbox },
  { id: "p-build", label: "Build My Day", sub: "Page", href: "/build-day", icon: CalendarClock },
  { id: "p-interests", label: "Interests", sub: "Page", href: "/interests", icon: Heart },
  { id: "p-mindful", label: "Mindfulness", sub: "Page", href: "/mindfulness", icon: Wind },
  { id: "p-clock", label: "World Clock", sub: "Page", href: "/world-clock", icon: Globe },
  { id: "p-notes", label: "Notes", sub: "Page", href: "/notes", icon: StickyNote },
  { id: "p-cal", label: "Calendar", sub: "Page", href: "/calendar", icon: Calendar },
  { id: "p-tasks", label: "Tasks", sub: "Page", href: "/tasks", icon: CheckSquare },
  { id: "p-vault", label: "Vault", sub: "Page", href: "/vault", icon: Archive },
  { id: "p-home", label: "HomeOS", sub: "Page", href: "/homeos", icon: Home },
  { id: "p-subs", label: "Subscription", sub: "Page", href: "/subscriptions", icon: CreditCard },
  { id: "p-settings", label: "Settings", sub: "Page", href: "/settings", icon: Settings },
];

const PAGE_KEYWORDS: Record<string, string> = {
  "p-add": "new capture receipt upload",
  "p-home": "home subscriptions devices rooms arrivals",
  "p-build": "plan schedule day",
};

/** Search the user's real content across Supabase tables (RLS-scoped). */
async function searchContent(raw: string): Promise<Item[]> {
  const q = raw.replace(/[%,()]/g, " ").trim();
  if (q.length < 2) return [];
  const like = `%${q}%`;
  const supabase = createClient();
  try {
    const [inbox, tasks, events, notes, vault] = await Promise.all([
      supabase.from("inbox_items").select("id,title,summary").or(`title.ilike.${like},summary.ilike.${like}`).limit(4),
      supabase.from("extracted_tasks").select("id,title").ilike("title", like).limit(4),
      supabase.from("calendar_events").select("id,title").ilike("title", like).limit(4),
      supabase.from("notes").select("id,content").ilike("content", like).limit(4),
      supabase.from("vault_items").select("id,title,summary").or(`title.ilike.${like},summary.ilike.${like}`).limit(4),
    ]);
    const out: Item[] = [];
    for (const r of inbox.data ?? []) out.push({ id: `i-${r.id}`, label: r.title || "Drop item", sub: "The Drop", href: `/inbox/${r.id}`, icon: Inbox });
    for (const r of tasks.data ?? []) out.push({ id: `t-${r.id}`, label: r.title, sub: "Task", href: "/tasks", icon: CheckSquare });
    for (const r of events.data ?? []) out.push({ id: `e-${r.id}`, label: r.title, sub: "Event", href: "/calendar", icon: Calendar });
    for (const r of notes.data ?? []) out.push({ id: `n-${r.id}`, label: (r.content || "Note").slice(0, 64), sub: "Note", href: "/notes", icon: StickyNote });
    for (const r of vault.data ?? []) out.push({ id: `v-${r.id}`, label: r.title, sub: "Vault", href: "/vault", icon: Archive });
    return out;
  } catch {
    return [];
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [content, setContent] = React.useState<Item[]>([]);
  const [searching, setSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pageResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAGES;
    return PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        PAGE_KEYWORDS[p.id]?.includes(q),
    );
  }, [query]);

  const results = React.useMemo(
    () => (query.trim() ? [...pageResults, ...content] : pageResults),
    [query, pageResults, content],
  );

  React.useEffect(() => setActive(0), [results.length, open]);

  // Debounced content search.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setContent([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchContent(q);
      if (active) {
        setContent(res);
        setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

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
      setContent([]);
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
            placeholder="Search pages, tasks, notes, events…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="hidden rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              esc
            </kbd>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {searching ? "Searching…" : `Nothing matches “${query}”.`}
            </p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                onClick={() => go(c.href)}
                onMouseEnter={() => setActive(i)}
                className={
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm " +
                  (i === active ? "bg-accent text-accent-foreground" : "text-foreground")
                }
              >
                <c.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.label}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{c.sub}</span>
                {i === active && (
                  <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
