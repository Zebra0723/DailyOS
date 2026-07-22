"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Mail, X, Lock, Clock } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { approveReply, declineReply, editAndApproveReply } from "@/app/support/approvals/actions";
import type { PendingReplyView } from "@/lib/replies";

const ACCENT = "#bf502b";

function mailtoHref(to: string, body: string): string {
  const subject = "Re: your DailyOS feedback";
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function OwnerActions({
  item,
  emailReady,
  onDone,
}: {
  item: PendingReplyView;
  emailReady: boolean;
  onDone: (msg: { ok: boolean; text: string }) => void;
}) {
  const { reply } = item;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(reply.body);
  const [pending, start] = React.useTransition();

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    start(async () => {
      const res = await fn();
      onDone({ ok: res.ok, text: res.message });
    });
  }

  if (editing) {
    return (
      <div className="mt-2 grid gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1.5 text-sm text-[#4b443b] outline-none focus:border-[#bf502b]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending || !draft.trim()}
            onClick={() => run(() => editAndApproveReply(reply.id, draft))}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
            style={{ background: ACCENT, color: "#fff" }}
          >
            <Check className="size-3.5" /> {emailReady ? "Save & send" : "Save & approve"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setDraft(reply.body);
              setEditing(false);
            }}
            className="text-xs font-semibold text-[#8a8073] underline-offset-2 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => approveReply(reply.id))}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
        style={{ background: ACCENT, color: "#fff" }}
      >
        <Check className="size-3.5" /> {emailReady ? "Approve & send" : "Approve"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
        style={{ border: "1px solid #e6c9bd", background: "#f7ece4", color: ACCENT }}
      >
        <Pencil className="size-3.5" /> Edit
      </button>
      {!emailReady && reply.to_email && (
        <a
          href={mailtoHref(reply.to_email, reply.body)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{ border: "1px solid #e6ded2", background: "#f2e6da", color: "#4b443b" }}
        >
          <Mail className="size-3.5" /> Send manually
        </a>
      )}
      <ConfirmButton
        label={
          <span className="inline-flex items-center gap-1.5">
            <X className="size-3.5" /> Decline
          </span>
        }
        style={{
          display: "inline-flex",
          background: "#fbe9e7",
          color: "#9a3412",
          border: "1px solid #f0c4bd",
          borderRadius: 10,
          padding: "5px 10px",
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          opacity: pending ? 0.5 : 1,
        }}
        title="Decline this reply?"
        message="The draft won't be sent to the person who left the feedback."
        warn="This can't be undone."
        confirmLabel="Decline"
        onConfirm={async () => {
          const res = await declineReply(reply.id);
          onDone({ ok: res.ok, text: res.message });
        }}
      />
    </div>
  );
}

/** Owner-facing approval queue. Non-owners see the queue but no actions. */
export function ApprovalsList({
  items,
  isOwner,
  emailReady,
}: {
  items: PendingReplyView[];
  isOwner: boolean;
  emailReady: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Record<string, { ok: boolean; text: string }>>({});

  function handleDone(id: string, msg: { ok: boolean; text: string }) {
    setMessages((m) => ({ ...m, [id]: msg }));
    if (msg.ok) router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#8a8073]">
        Nothing waiting for approval — the queue is clear.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {!isOwner && (
        <div className="flex items-center gap-2 rounded-xl border border-[#e6ded2] bg-[#f7ece4] px-3 py-2 text-sm text-[#6b6157]">
          <Lock className="size-4 shrink-0 text-[#bf502b]" />
          Only the owner can approve replies. You can see what's queued below.
        </div>
      )}
      {items.map((item) => {
        const { reply, feedback } = item;
        const msg = messages[reply.id];
        return (
          <div key={reply.id} className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
            <div className="rounded-lg border border-[#e6ded2] bg-[#faf6ef] px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a8073]">
                <span className="font-semibold uppercase tracking-wide">Original feedback</span>
                {feedback?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" /> {feedback.email}
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#4b443b]">
                {feedback ? feedback.message : "(original feedback not found)"}
              </p>
            </div>

            <div className="mt-2 rounded-lg border border-[#e6c9bd] bg-[#f7ece4] px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#bf502b]">
                <span className="font-semibold uppercase tracking-wide">Drafted reply</span>
                <span className="text-[#8a8073]">by {reply.author_email}</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[#a39a8c]">
                  <Clock className="size-3" /> {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#1c1a17]">{reply.body}</p>
              <p className="mt-1 text-[11px] text-[#8a8073]">
                To: {reply.to_email || "(no recipient)"}
              </p>
            </div>

            {isOwner ? (
              <OwnerActions
                item={item}
                emailReady={emailReady}
                onDone={(m) => handleDone(reply.id, m)}
              />
            ) : null}

            {msg && (
              <p
                className={`mt-2 text-xs font-medium ${msg.ok ? "text-[#5b7a3a]" : "text-[#9a3412]"}`}
              >
                {msg.text}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
