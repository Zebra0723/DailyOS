import { Database } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { MAIN_APP_URL } from "@/lib/main";
import { card, HEALTH_TABLES, count } from "@/lib/pulse-data";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const admin = createServiceClient();
  const tableCounts = await Promise.all(HEALTH_TABLES.map((t) => count(admin, t)));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-sm text-[#6b6157]">Row counts across the DailyOS database at {MAIN_APP_URL.replace(/^https?:\/\//, "")}.</p>
        </div>
        <AutoRefresh intervalSec={30} />
      </div>

      {/* Per-table row counts */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Database className="size-4" style={{ color: "#bf502b" }} />
          <h2 className="text-base font-bold">Table row counts</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HEALTH_TABLES.map((t, i) => (
            <div key={t} className="rounded-xl border border-[#e6ded2] bg-white p-3">
              <div className="text-lg font-bold" style={{ color: "#bf502b" }}>{tableCounts[i] ?? "—"}</div>
              <div className="truncate text-xs text-[#6b6157]" title={t}>{t}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
