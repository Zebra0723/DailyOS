"use client";

import * as React from "react";
import {
  X,
  Users,
  Globe,
  Search,
  Youtube,
  MessageCircle,
  Newspaper,
  Rocket,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISCOVERY_KEY = "discovery";

const SOURCES = [
  { id: "friend-family", label: "Friend or family", icon: Users },
  { id: "social-media", label: "Social media", icon: Globe },
  { id: "google", label: "Google search", icon: Search },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "reddit", label: "Reddit", icon: MessageCircle },
  { id: "blog-article", label: "Blog or article", icon: Newspaper },
  { id: "product-hunt", label: "Product Hunt", icon: Rocket },
  { id: "other", label: "Other", icon: HelpCircle },
] as const;

function storageKey(userId: string) {
  return `dailyos-discovery:${userId}`;
}

export function DiscoverySurvey({ userId }: { userId: string }) {
  const [show, setShow] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [otherText, setOtherText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(userId)) === "1") return;
    } catch {
      return;
    }

    const supabase = createClient();
    supabase
      .from("user_state")
      .select("value")
      .eq("user_id", userId)
      .eq("key", DISCOVERY_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          try { localStorage.setItem(storageKey(userId), "1"); } catch {}
          return;
        }
        const t = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(t);
      });
  }, [userId]);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(storageKey(userId), "1"); } catch {}
  }

  async function submit() {
    if (!selected) return;
    setSaving(true);
    const value = {
      source: selected,
      detail: selected === "other" ? otherText.trim() || null : null,
    };
    try {
      const supabase = createClient();
      await supabase
        .from("user_state")
        .upsert(
          { user_id: userId, key: DISCOVERY_KEY, value },
          { onConflict: "user_id,key" },
        );
    } catch {}
    try { localStorage.setItem(storageKey(userId), "1"); } catch {}
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={dismiss}
      />
      <div className="relative mx-4 w-full max-w-md animate-fade-in rounded-2xl border bg-card shadow-elevated">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="px-6 pt-6 pb-2 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Search className="size-6" />
          </div>
          <h2 className="font-display text-lg font-bold tracking-tight">
            How did you discover DailyOS?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;d love to know — helps us reach more people like you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 px-6 py-4">
          {SOURCES.map((s) => {
            const Icon = s.icon;
            const active = selected === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(active ? null : s.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30 hover:bg-accent/30",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </div>

        {selected === "other" && (
          <div className="px-6 pb-2">
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Tell us where..."
              maxLength={200}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t px-6 py-4">
          <button
            onClick={dismiss}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
          <Button
            size="sm"
            disabled={!selected || saving}
            onClick={submit}
          >
            {saving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
