import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";

export const dynamic = "force-dynamic";
export const metadata = { title: "Back soon · DailyOS" };

/**
 * Public maintenance screen. The middleware sends non-exempt visitors here
 * (logged out or in) while maintenance is on. If maintenance is off — or the
 * viewer is exempt — there's nothing to show, so bounce them back into the app.
 */
export default async function MaintenancePage() {
  const supabase = createClient();
  const [
    {
      data: { user },
    },
    cfgRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "global")
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
  ]);

  const cfg = (cfgRes?.value ?? {}) as {
    maintenance?: boolean;
    maintenanceAllowlist?: string[];
  };
  if (!cfg.maintenance) redirect(user ? "/today" : "/login");

  const allow = new Set(
    (cfg.maintenanceAllowlist ?? []).map((e) => e.toLowerCase()),
  );
  const exempt =
    Boolean(user) &&
    (isAdminUser(user) || allow.has((user!.email ?? "").toLowerCase()));
  if (exempt) redirect("/today");

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-3xl font-bold">Back soon</h1>
        <p className="mt-3 text-muted-foreground">
          DailyOS is down for a quick bit of maintenance. Your data is safe —
          please check back in a little while.
        </p>
        {/* Team access: only an allowlisted (or admin) account can actually get
            in — a non-authorised login is bounced straight back here. */}
        <a
          href={user ? "/auth/signout" : "/login"}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {user ? "Log in to a different account" : "Team log in"}
        </a>
      </div>
    </div>
  );
}
