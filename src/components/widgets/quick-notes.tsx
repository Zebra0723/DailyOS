"use client";

import * as React from "react";
import { StickyNote } from "lucide-react";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "widget-quick-notes";

export function QuickNotesWidget({ userId }: { userId?: string }) {
  const [text, setText] = React.useState("");

  // Per-account local cache; the remote copy is already scoped to the account.
  const localKey = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<{ text: string }>(STORAGE_KEY);
      if (remote?.text) { setText(remote.text); return; }
      const local = localStorage.getItem(localKey);
      if (local) setText(local);
    })();
  }, [localKey]);

  const save = React.useMemo(
    () =>
      debounce((val: string) => {
        localStorage.setItem(localKey, val);
        saveRemote(STORAGE_KEY, { text: val });
      }, 800),
    [localKey],
  );

  function onChange(val: string) {
    setText(val);
    save(val);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="size-4 text-primary" /> Quick Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jot something down..."
          className="min-h-[120px] w-full resize-none rounded-lg border bg-transparent p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </CardContent>
    </Card>
  );
}
