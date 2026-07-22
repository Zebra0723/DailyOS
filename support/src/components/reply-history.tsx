import type { Reply } from "@/lib/replies";

const STYLES: Record<Reply["status"], { label: string; bg: string; color: string }> = {
  approved: { label: "Sent", bg: "#e7f0dc", color: "#4d6b2b" },
  pending: { label: "Pending approval", bg: "#f7ece4", color: "#bf502b" },
  declined: { label: "Declined", bg: "#f2e6da", color: "#8a8073" },
};

function StatusBadge({ reply }: { reply: Reply }) {
  const s = STYLES[reply.status];
  // An approved-but-unsent reply means email wasn't configured at send time.
  const label = reply.status === "approved" && !reply.sent ? "Approved · not sent" : s.label;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}

/** Chronological record of every reply drafted for a feedback item. */
export function ReplyHistory({ replies }: { replies: Reply[] }) {
  if (!replies.length) return null;
  const ordered = [...replies].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return (
    <div className="mt-2 grid gap-1.5">
      {ordered.map((r) => (
        <div key={r.id} className="rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1.5">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a8073]">
            <StatusBadge reply={r} />
            <span>by {r.author_email}</span>
            <span className="ml-auto">{new Date(r.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#4b443b]">{r.body}</p>
          {r.send_error && (
            <p className="mt-1 text-[11px] font-medium text-[#9a3412]">Send error: {r.send_error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
