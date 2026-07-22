import { MessageSquare, BellRing, UserPlus, Inbox } from "lucide-react";
import { getActivity, type ActivityItem } from "@/lib/hub";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

const META: Record<ActivityItem["source"], { label: string; icon: typeof Inbox; dot: string }> = {
  feedback: { label: "Feedback", icon: MessageSquare, dot: "#0284c7" },
  push: { label: "Push", icon: BellRing, dot: "#e11d48" },
  signup: { label: "Signup", icon: UserPlus, dot: "#15803d" },
};

/** Compact "3h ago" style relative time. */
function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function ActivityPage() {
  const items = await getActivity();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-sm text-[#6b6157]">One cross-app timeline — recent feedback, push fires and signups, newest first.</p>
      </div>

      {items.length === 0 ? (
        <div className={`${card} flex items-center gap-2 text-sm text-[#6b6157]`}>
          <Inbox className="size-4 text-[#a89b8a]" /> Nothing recent — or the source tables are unreachable.
        </div>
      ) : (
        <ol className="grid gap-2">
          {items.map((it, i) => {
            const m = META[it.source];
            const Icon = m.icon;
            return (
              <li key={`${it.source}-${i}-${it.at}`} className={`${card} flex items-start gap-3`}>
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: "#f2e6da" }}>
                  <Icon className="size-3.5" style={{ color: m.dot }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: m.dot }}>{m.label}</span>
                    <span className="text-sm font-semibold text-[#1c1a17]">{it.title}</span>
                    <span suppressHydrationWarning className="ml-auto shrink-0 text-[11px] text-[#a89b8a]">{ago(it.at)}</span>
                  </div>
                  {it.detail && <p className="mt-0.5 break-words text-xs text-[#6b6157]">{it.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-[#a89b8a]">Aggregated live from the database. Each source is read independently, so a missing table just drops out of the feed.</p>
    </div>
  );
}
