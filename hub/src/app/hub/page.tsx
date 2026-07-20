import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Gauge, Users, BellRing, MessageSquare, CalendarClock, Wrench } from "lucide-react";
import { getHubStats, pingApps, appLinks, platforms, MAIN_APP_URL } from "@/lib/hub";
import { AutoRefresh } from "@/components/auto-refresh";
import { QuickActions } from "@/components/quick-actions";

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

export default async function HubDashboard() {
  const [s, pings] = await Promise.all([getHubStats(), pingApps()]);
  const apps = appLinks();
  const plats = platforms();
  const cronEnabled = !!process.env.CRON_SECRET;
  const renderedAt = Date.now();

  const latency = s.latencyMs === null ? "—" : `${s.latencyMs} ms`;
  const latencyTone: "ok" | "warn" = s.latencyMs === null ? "warn" : s.latencyMs < 1500 ? "ok" : "warn";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hub</h1>
          <p className="text-sm text-[#6b6157]">Your whole DailyOS operation, at a glance.</p>
        </div>
        <AutoRefresh renderedAt={renderedAt} />
      </div>

      {/* Alerts */}
      {s.maintenance && (
        <div className="flex items-center gap-2 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          <Wrench className="size-4 shrink-0" /> Maintenance mode is <b>ON</b> — users see the maintenance screen.
        </div>
      )}
      {s.announcement && (
        <div className="flex items-start gap-2 rounded-xl border border-[#e6ded2] bg-[#fbf6ec] p-3 text-sm text-[#6b5b3e]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span>Live announcement: &ldquo;{s.announcement}&rdquo;</span>
        </div>
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

      {/* Open an app */}
      <section>
        <h2 className="mb-3 text-base font-bold">Open an app</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((a) => {
            const ping = pings[a.key];
            const inner = (
              <div className="flex items-start gap-3">
                <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: a.dot }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    DailyOS {a.label}
                    {a.url && <ArrowUpRight className="size-3.5 text-[#a89b8a]" />}
                    {ping && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#8a8073]">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: ping.ok ? "#15803d" : "#c0392b" }}
                          aria-label={ping.ok ? "up" : "down"}
                        />
                        {ping.ok ? (ping.ms === null ? "up" : `${ping.ms} ms`) : "down"}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-[#6b6157]">{a.blurb}</div>
                  {!a.url && <div className="mt-1 text-[11px] text-[#a89b8a]">Set HUB_{a.key.toUpperCase()}_URL to link it</div>}
                </div>
              </div>
            );
            return a.url ? (
              <a key={a.key} href={a.url} target="_blank" rel="noreferrer" className={`${card} transition-colors hover:border-[#d9a38f]`}>{inner}</a>
            ) : (
              <div key={a.key} className={`${card} opacity-70`}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <QuickActions cronEnabled={cronEnabled} maintenance={s.maintenance} />

      {/* Platforms */}
      <section>
        <h2 className="mb-3 text-base font-bold">Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {plats.map((p) => (
            <a key={p.label} href={p.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3.5 py-2 text-sm font-semibold transition-colors hover:border-[#d9a38f]">
              {p.label}
              <ArrowUpRight className="size-3.5 text-[#a89b8a]" />
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#a89b8a]">Quick links to the real dashboards — for billing, secrets and setup the apps can&rsquo;t reach.</p>
      </section>

      <Link href="/hub" className="text-xs text-[#a89b8a] hover:text-[#6b6157]">Refresh</Link>
    </div>
  );
}
