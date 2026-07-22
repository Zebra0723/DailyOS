"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createReply } from "@/app/support/actions";

const ACCENT = "#bf502b";

/**
 * Small reply box shown on each feedback item. The server action decides what
 * happens on submit: the owner's reply sends immediately, everyone else's
 * queues for the owner's approval — so this just reflects that outcome.
 */
export function ReplyComposer({
  feedbackId,
  isOwner,
  emailReady,
}: {
  feedbackId: string;
  isOwner: boolean;
  emailReady: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();

  function submit() {
    if (!body.trim() || pending) return;
    start(async () => {
      const res = await createReply(feedbackId, body);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    });
  }

  const hint = isOwner
    ? emailReady
      ? "Your reply sends immediately."
      : "Your reply is approved instantly — email isn't configured, so send it manually."
    : "This goes to the owner for approval before it's sent.";

  return (
    <div className="mt-2 rounded-lg border border-[#e6ded2] bg-[#faf6ef] p-2.5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        rows={2}
        className="w-full resize-y rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1.5 text-sm text-[#4b443b] outline-none focus:border-[#bf502b]"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
          style={{ background: ACCENT, color: "#fff" }}
        >
          <Send className="size-3.5" />
          {pending ? "Working…" : isOwner ? "Send reply" : "Send for approval"}
        </button>
        <span className="text-xs text-[#8a8073]">{hint}</span>
      </div>
      {msg && (
        <p className={`mt-1.5 text-xs font-medium ${msg.ok ? "text-[#5b7a3a]" : "text-[#9a3412]"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
