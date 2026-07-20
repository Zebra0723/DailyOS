"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, Mail } from "lucide-react";
import { setResolved, deleteFeedback } from "@/app/support/actions";
import { ConfirmButton } from "@/components/confirm-button";

export interface Feedback {
  id: string;
  email: string | null;
  message: string;
  resolved: boolean;
  created_at: string;
}

const SKY = "#0284c7";

export function FeedbackList({ items }: { items: Feedback[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"open" | "resolved" | "all">("open");

  const shown = items.filter((f) =>
    filter === "all" ? true : filter === "open" ? !f.resolved : f.resolved,
  );

  return (
    <div className="grid gap-4">
      <div className="flex gap-1.5">
        {(["open", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
            style={f === filter ? { background: SKY, color: "#fff" } : { border: "1px solid #e6ded2", background: "#fffdf9", color: "#4b443b" }}
          >
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[#8a8073]">Nothing here.</p>
      ) : (
        <div className="grid gap-2">
          {shown.map((f) => (
            <div key={f.id} className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
              <div className="flex items-center gap-2 text-xs text-[#8a8073]">
                {f.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {f.email}</span>}
                <span className="ml-auto">{new Date(f.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{f.message}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={async () => { await setResolved(f.id, !f.resolved); router.refresh(); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={f.resolved ? { background: "#eef2f5", color: "#4b443b" } : { background: SKY, color: "#fff" }}
                >
                  {f.resolved ? <><RotateCcw className="size-3.5" /> Reopen</> : <><Check className="size-3.5" /> Resolve</>}
                </button>
                <ConfirmButton
                  label={<span className="inline-flex items-center gap-1.5"><Trash2 className="size-3.5" /> Delete</span>}
                  style={{ display: "inline-flex", background: "#fbe9e7", color: "#9a3412", border: "1px solid #f0c4bd", borderRadius: 10, padding: "5px 10px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                  title="Delete this feedback?"
                  message="This permanently removes the message."
                  warn="This can't be undone."
                  onConfirm={async () => { await deleteFeedback(f.id); router.refresh(); }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
