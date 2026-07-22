import { Activity, BarChart3, Gauge } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { MAIN_APP_URL } from "@/lib/main";
import { card, activityHistogram, recentActivity, rel } from "@/lib/pulse-data";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const admin = createServiceClient();

  const [histogram, activity] = await Promise.all([
    activityHistogram(admin),
    recentActivity(admin),
  ]);

  const peakBar = histogram ? Math.max(1, ...histogram.map((b) => b.count)) : 1;
  const histTotal = histogram ? histogram.reduce((s, b) => s + b.count, 0) : null;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-[#6b6157]">Push traffic on {MAIN_APP_URL.replace(/^https?:\/\//, "")} over the last day.</p>
        </div>
        <AutoRefresh intervalSec={30} />
      </div>

      {/* Activity timeline (24h histogram) */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4" style={{ color: "#bf502b" }} />
          <h2 className="text-base font-bold">Push activity (24h)</h2>
          <span className="ml-auto rounded-full bg-[#f2e6da] px-2 py-0.5 text-xs font-bold" style={{ color: "#bf502b" }}>
            {histTotal ?? "—"}
          </span>
        </div>
        {histogram === null ? (
          <p className="mt-3 text-sm text-[#8a8073]">—</p>
        ) : histTotal === 0 ? (
          <p className="mt-3 text-sm text-[#8a8073]">No pushes in the last 24 hours.</p>
        ) : (
          <div className="mt-4">
            <div className="flex h-28 items-end gap-[3px]">
              {histogram.map((b, i) => (
                <div key={i} className="group relative flex flex-1 items-end" title={`${b.label} — ${b.count} push${b.count === 1 ? "" : "es"}`}>
                  <div
                    className="w-full rounded-t-sm transition-colors"
                    style={{
                      height: `${Math.max(b.count > 0 ? 6 : 2, Math.round((b.count / peakBar) * 100))}%`,
                      background: b.count > 0 ? "#bf502b" : "#efe7db",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-[#8a8073]">
              <span>{histogram[0]?.label}</span>
              <span>{histogram[Math.floor(histogram.length / 2)]?.label}</span>
              <span>now</span>
            </div>
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Activity className="size-4" style={{ color: "#bf502b" }} />
          <h2 className="text-base font-bold">Recent push activity</h2>
        </div>
        {activity === null ? (
          <p className="mt-3 text-sm text-[#8a8073]">—</p>
        ) : activity.length === 0 ? (
          <p className="mt-3 text-sm text-[#8a8073]">No recent pushes.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Gauge className="size-3.5 shrink-0 text-[#8a8073]" />
                <span className="flex-1 truncate font-mono text-xs text-[#4b443b]" title={a.label}>{a.label}</span>
                <span className="shrink-0 text-xs text-[#8a8073]">{rel(a.iso)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
