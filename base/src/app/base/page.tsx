import Link from "next/link";
import { Database, CheckCircle2, XCircle, Terminal, Table2 } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { managementConfigured } from "@/lib/management";
import { HEALTH_TABLES } from "@/lib/migrations";

export const dynamic = "force-dynamic";

async function countOrMissing(
  admin: ReturnType<typeof createServiceClient>,
  table: string,
): Promise<number | null> {
  try {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export default async function Dashboard() {
  const admin = createServiceClient();
  const results = await Promise.all(
    HEALTH_TABLES.map(async (t) => ({ table: t, count: await countOrMissing(admin, t) })),
  );
  const missing = results.filter((r) => r.count === null);
  const present = results.filter((r) => r.count !== null);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">DailyOS Base</h1>
        <p className="text-sm text-[#6b6157]">Live control of your Supabase database.</p>
      </div>

      {/* Setup health */}
      <section className={card}>
        <div className="mb-3 flex items-center gap-2">
          <Database className="size-4 text-[#0d9488]" />
          <h2 className="text-base font-bold">Setup health</h2>
        </div>
        {missing.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> All expected tables exist.
          </p>
        ) : (
          <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm">
            <p className="font-semibold text-[#9a3412]">
              {missing.length} table{missing.length === 1 ? "" : "s"} missing:{" "}
              {missing.map((m) => m.table).join(", ")}.
            </p>
            <Link href="/base/sql" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#0d9488] px-3 py-1.5 text-xs font-semibold text-white">
              <Terminal className="size-3.5" /> Go to SQL → Apply setup
            </Link>
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {results.map((r) => (
            <div key={r.table} className="flex items-center gap-1.5 text-xs">
              {r.count === null ? (
                <XCircle className="size-3.5 shrink-0 text-[#c0392b]" />
              ) : (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              )}
              <span className="truncate">{r.table}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Row counts */}
      <section>
        <h2 className="mb-3 text-base font-bold">Row counts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {present.map((r) => (
            <Link key={r.table} href={`/base/tables?t=${r.table}`} className={`${card} transition-colors hover:border-[#0d9488]`}>
              <div className="text-xl font-bold text-[#0d9488]">{r.count}</div>
              <div className="truncate text-xs text-[#6b6157]">{r.table}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/base/tables" className="inline-flex items-center gap-2 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-4 py-2 text-sm font-semibold hover:border-[#0d9488]">
          <Table2 className="size-4 text-[#0d9488]" /> Browse tables
        </Link>
        <Link href="/base/sql" className="inline-flex items-center gap-2 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-4 py-2 text-sm font-semibold hover:border-[#0d9488]">
          <Terminal className="size-4 text-[#0d9488]" /> SQL console
        </Link>
      </div>

      {!managementConfigured() && (
        <p className="text-xs text-[#8a8073]">
          Tip: set <code>SUPABASE_PROJECT_REF</code> and <code>SUPABASE_ACCESS_TOKEN</code> to enable the SQL console and one-tap setup.
        </p>
      )}
    </div>
  );
}
