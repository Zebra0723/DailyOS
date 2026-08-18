import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  CreditCard,
  Database,
  Activity,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TABLES: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop items" },
  { table: "extracted_tasks", label: "Tasks" },
  { table: "calendar_events", label: "Events" },
  { table: "notes", label: "Notes" },
  { table: "vault_items", label: "Vault items" },
  { table: "push_subscriptions", label: "Push devices" },
];

const ACTIVITY_TABLES: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop" },
  { table: "extracted_tasks", label: "Task" },
  { table: "calendar_events", label: "Event" },
  { table: "notes", label: "Note" },
];

type Client = ReturnType<typeof createServiceClient>;

async function countRows(admin: Client, table: string): Promise<number> {
  const { count } = await admin
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function recentFrom(admin: Client, table: string, label: string) {
  const { data } = await admin
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    label,
    text:
      String(
        r.title ?? r.content ?? r.summary ?? r.id ?? "",
      ).slice(0, 80) || "(untitled)",
    at: r.created_at ? String(r.created_at) : "",
  }));
}

/** Resolve a user's effective plan tier (mirrors admin/src/lib/plan.ts). */
function effectiveTier(
  u: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> },
): "free" | "plus" | "pro" {
  const meta = u.user_metadata ?? {};
  const raw = (meta.tier as string) ?? (meta.plan as string) ?? "free";
  if (raw !== "plus" && raw !== "pro") return "free";
  const exp = meta.plan_exp;
  const expMs = exp == null ? 0 : Number(exp);
  if (expMs > 0 && Date.now() > expMs) return "free";
  return raw;
}

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) redirect("/today");

  const admin = createServiceClient();

  const [{ data: userData }, counts, activityLists] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    Promise.all(
      TABLES.map((t) => countRows(admin, t.table).catch(() => 0)),
    ),
    Promise.all(
      ACTIVITY_TABLES.map((a) =>
        recentFrom(admin, a.table, a.label).catch(() => []),
      ),
    ),
  ]);

  const users = (userData?.users ?? [])
    .slice()
    .sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );

  // Analytics
  const DAY = 86_400_000;
  const nowMs = Date.now();
  const plans = { free: 0, plus: 0, pro: 0 };
  let signups7 = 0;
  let signups30 = 0;
  let admins = 0;
  for (const u of users) {
    const created = new Date(u.created_at ?? 0).getTime();
    if (nowMs - created < 7 * DAY) signups7++;
    if (nowMs - created < 30 * DAY) signups30++;
    if (u.app_metadata?.admin === true) {
      admins++;
      continue;
    }
    const tier = effectiveTier(u);
    plans[tier]++;
  }
  const customers = Math.max(0, users.length - admins);
  const paid = plans.plus + plans.pro;
  const mrr = plans.plus * 4 + plans.pro * 8;

  const activity = activityLists
    .flat()
    .filter((x) => x.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const recentUsers = users.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Growth stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total users"
          value={users.length}
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="New (7d)"
          value={signups7}
          icon={<UserPlus className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="New (30d)"
          value={signups30}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Est. MRR"
          value={`£${mrr}`}
          icon={<CreditCard className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Plan breakdown + Table counts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Plan breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {customers} customer{customers !== 1 ? "s" : ""} &middot; {paid}{" "}
              paid &middot; {admins} admin{admins !== 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <PlanBar label="Free" count={plans.free} total={customers} />
            <PlanBar label="Plus" count={plans.plus} total={customers} />
            <PlanBar label="Pro" count={plans.pro} total={customers} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4" />
              Table row counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {TABLES.map((t, i) => (
                <div
                  key={t.table}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="font-medium tabular-nums">
                    {counts[i].toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent signups + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus className="h-4 w-4" />
              Recent sign-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-foreground">
                      {u.email}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <div className="space-y-2">
                {activity.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-[11px]"
                    >
                      {a.label}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate">
                      {a.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------- helper components ---------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums leading-none">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count} &middot; {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
