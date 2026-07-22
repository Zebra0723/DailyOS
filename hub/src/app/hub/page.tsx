import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Gauge, Users, BellRing, MessageSquare, CalendarClock, Wrench } from "lucide-react";
import { getHubStats, MAIN_APP_URL } from "@/lib/hub";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

function Stat({ icon: Icon, label, value, sub, tone }: { icon: typeof Gauge; label: string; value: string; sub?: string; tone?: "ok" | "warn" }) {
  const color = tone === "warn" ? "#c0392b" : tone === "ok" ? "#15803d" : "#bf502b";
  return (
    <div className={card}>
      <div className="mb-1 flex items-center gap-1.5 text-[#8a8073]">
        <Icon className="size-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-[#8a8073]">{sub}</div>}
    </div>
  );
}

export default async function OverviewPage() {
  const s = await getHubStats();
  const renderedAt = Date.now();

  const latency = s.latencyMs === null ? "—" : `${s.latencyMs} ms`;
  const latencyTone: "ok" | "warn" = s.latencyMs === null ? "warn" : s.latencyMs < 1500 ? "ok" : "warn";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-[#6b6157]">Your whole DailyOS operation, at a glance.</p>
        </div>
        <AutoRefresh renderedAt={renderedAt} />
      </div>

      {/* Alerts */}
      {s.maintenance && (
        <Link href="/hub/controls" className="flex items-center gap-2 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412] transition-colors hover:border-[#e39a8c]">
          <Wrench className="size-4 shrink-0" /> Maintenance mode is <b>ON</b> — users see the maintenance screen. <span className="ml-auto text-xs font-medium">Manage →</span>
        </Link>
      )}
      {s.announcement && (
        <Link href="/hub/controls" className="flex items-start gap-2 rounded-xl border border-[#e6ded2] bg-[#fbf6ec] p-3 text-sm text-[#6b5b3e] transition-colors hover:border-[#d9a38f]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span>Live announcement: &ldquo;{s.announcement}&rdquo;</span>
        </Link>
      )}

      {/* Live vitals */}
      <section>
        <h2 className="mb-3 text-base font-bold">Live vitals</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat icon={Gauge} label="App version" value={s.version ?? "unreachable"} sub={MAIN_APP_URL.replace(/^https?:\/\//, "")} tone={s.version ? "ok" : "warn"} />
          <Stat icon={ArrowUpRight} label="Response time" value={latency} tone={latencyTone} />
          <Stat icon={Users} label="Users" value={s.users?.toString() ?? "—"} />
          <Stat icon={BellRing} label="Push devices" value={s.pushDevices?.toString() ?? "—"} />
          <Stat icon={MessageSquare} label="Open feedback" value={s.openFeedback?.toString() ?? "—"} tone={s.openFeedback ? "warn" : undefined} sub={s.openFeedback ? "needs triage" : "all clear"} />
          <Stat icon={CalendarClock} label="Scheduled pushes" value={s.scheduledPending?.toString() ?? "—"} sub="waiting to send" />
          <Stat icon={Wrench} label="Maintenance" value={s.maintenance ? "ON" : "off"} tone={s.maintenance ? "warn" : "ok"} />
        </div>
      </section>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/hub/apps" className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3.5 py-2 font-semibold transition-colors hover:border-[#d9a38f]">
          Check apps <ArrowUpRight className="size-3.5 text-[#a89b8a]" />
        </Link>
        <Link href="/hub/activity" className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3.5 py-2 font-semibold transition-colors hover:border-[#d9a38f]">
          Recent activity <ArrowUpRight className="size-3.5 text-[#a89b8a]" />
        </Link>
        <Link href="/hub/controls" className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3.5 py-2 font-semibold transition-colors hover:border-[#d9a38f]">
          Controls <ArrowUpRight className="size-3.5 text-[#a89b8a]" />
        </Link>
      </div>
    </div>
  );
}
