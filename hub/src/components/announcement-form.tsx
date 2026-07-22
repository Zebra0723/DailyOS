"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { setAnnouncement } from "@/app/hub/actions";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

/** Read/write the global announcement banner shown to every DailyOS user. */
export function AnnouncementForm({ current }: { current: string }) {
  const router = useRouter();
  const [text, setText] = useState(current);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const dirty = text.trim() !== current.trim();

  function save() {
    setMsg(null);
    start(async () => {
      const r = await setAnnouncement(text);
      setMsg(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className={card}>
      <div className="mb-1 flex items-center gap-1.5 text-[#8a8073]">
        <Megaphone className="size-3.5" />
        <span className="text-xs font-medium">Global announcement</span>
      </div>
      <p className="mb-3 text-xs text-[#6b6157]">
        Shown as a banner to every user of the live app. Leave empty to hide it.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        rows={3}
        placeholder="e.g. Heads up — syncing may be slow while we upgrade."
        className="w-full resize-none rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-sm text-[#1c1a17] outline-none placeholder:text-[#a89b8a] focus:border-[#d9a38f]"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#a89b8a]">{text.trim().length}/280</span>
        <div className="flex items-center gap-2">
          {current && (
            <button
              type="button"
              onClick={() => setText("")}
              disabled={pending}
              className="rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#6b6157] transition-colors hover:bg-[#f2e6da] disabled:opacity-50"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#bf502b] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a7431f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save announcement"}
          </button>
        </div>
      </div>
      {msg && (
        <p className={`mt-2 break-words text-xs ${msg.ok ? "text-[#15803d]" : "text-[#c0392b]"}`}>
          {msg.ok ? "✓ " : "✗ "}
          {msg.message}
        </p>
      )}
    </div>
  );
}
