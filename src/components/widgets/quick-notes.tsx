"use client";

import * as React from "react";
import { StickyNote } from "lucide-react";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "widget-quick-notes";

export function QuickNotesWidget() {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<{ text: string }>(STORAGE_KEY);
      if (remote?.text) { setText(remote.text); return; }
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) setText(local);
    })();
  }, []);

  const save = React.useMemo(
    () =>
      debounce((val: string) => {
        localStorage.setItem(STORAGE_KEY, val);
        saveRemote(STORAGE_KEY, { text: val });
      }, 800),
    [],
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
