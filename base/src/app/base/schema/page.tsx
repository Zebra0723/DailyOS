import Link from "next/link";
import { runSql, managementConfigured } from "@/lib/management";

export const dynamic = "force-dynamic";

const TABLES = [
  "inbox_items", "extracted_tasks", "calendar_events", "notes", "vault_items",
  "push_subscriptions", "reward_codes", "user_state", "app_config",
  "admin_audit", "admin_reminders", "scheduled_pushes", "push_log",
  "processing_logs", "referrals", "feedback",
];

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export default async function SchemaPage({ searchParams }: { searchParams: { t?: string } }) {
  const table = TABLES.includes(searchParams.t ?? "") ? searchParams.t! : TABLES[0];

  if (!managementConfigured()) {
    return (
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-bold">Schema</h1>
          <p className="text-sm text-[#6b6157]">Columns and RLS policies per table.</p>
        </div>
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">
          Set <code>SUPABASE_PROJECT_REF</code> and <code>SUPABASE_ACCESS_TOKEN</code> to inspect schema.
        </div>
      </div>
    );
  }

  const safe = table.replace(/'/g, "''");
  const [colsRes, polRes] = await Promise.all([
    runSql(
      `select column_name, data_type, is_nullable, column_default
         from information_schema.columns
        where table_schema = 'public' and table_name = '${safe}'
        order by ordinal_position;`,
    ),
    runSql(
      `select policyname, cmd, roles, permissive, qual, with_check
         from pg_policies
        where schemaname = 'public' and tablename = '${safe}'
        order by policyname;`,
    ),
  ]);

  const cols = colsRes.ok ? colsRes.rows ?? [] : [];
  const pols = polRes.ok ? polRes.rows ?? [] : [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Schema</h1>
        <p className="text-sm text-[#6b6157]">Columns and RLS policies per table.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABLES.map((t) => (
          <Link
            key={t}
            href={`/base/schema?t=${t}`}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              t === table ? "bg-[#bf502b] text-white" : "border border-[#e6ded2] bg-[#fffdf9] text-[#4b443b] hover:border-[#bf502b]"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Columns */}
      <section className={card}>
        <h2 className="mb-3 text-base font-bold">Columns · {table}</h2>
        {!colsRes.ok ? (
          <p className="text-sm text-[#9a3412]">{colsRes.error}</p>
        ) : cols.length === 0 ? (
          <p className="text-sm text-[#8a8073]">No columns found — table may not exist yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e6ded2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2e3d3]">
                <tr>
                  <th className="px-2.5 py-1.5 font-semibold">Column</th>
                  <th className="px-2.5 py-1.5 font-semibold">Type</th>
                  <th className="px-2.5 py-1.5 font-semibold">Nullable</th>
                  <th className="px-2.5 py-1.5 font-semibold">Default</th>
                </tr>
              </thead>
              <tbody>
                {cols.map((c, i) => (
                  <tr key={i} className="border-t border-[#efe6d8]">
                    <td className="px-2.5 py-1.5 font-medium">{String(c.column_name)}</td>
                    <td className="px-2.5 py-1.5">{String(c.data_type)}</td>
                    <td className="px-2.5 py-1.5">{c.is_nullable === "YES" ? "yes" : "no"}</td>
                    <td className="max-w-[240px] truncate px-2.5 py-1.5 text-[#6b6157]">{c.column_default === null ? "—" : String(c.column_default)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Policies */}
      <section className={card}>
        <h2 className="mb-3 text-base font-bold">RLS policies · {table}</h2>
        {!polRes.ok ? (
          <p className="text-sm text-[#9a3412]">{polRes.error}</p>
        ) : pols.length === 0 ? (
          <p className="text-sm text-[#8a8073]">No policies. If RLS is enabled, this table currently denies all non-service access.</p>
        ) : (
          <div className="grid gap-2">
            {pols.map((p, i) => (
              <div key={i} className="rounded-xl border border-[#e6ded2] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{String(p.policyname)}</span>
                  <span className="rounded bg-[#e0f2f1] px-1.5 py-0.5 text-[11px] font-medium" style={{ color: "#a5401f" }}>{String(p.cmd)}</span>
                  <span className="text-[11px] text-[#8a8073]">{String(p.roles)}</span>
                  {p.permissive ? <span className="text-[11px] text-[#8a8073]">{String(p.permissive)}</span> : null}
                </div>
                {p.qual !== null && <p className="mt-1.5 font-mono text-[11px] text-[#6b6157]"><span className="text-[#8a8073]">USING</span> {String(p.qual)}</p>}
                {p.with_check !== null && <p className="mt-0.5 font-mono text-[11px] text-[#6b6157]"><span className="text-[#8a8073]">WITH CHECK</span> {String(p.with_check)}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
