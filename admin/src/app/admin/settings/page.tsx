import { createServiceClient } from "@/lib/supabase/service";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = createServiceClient();
  const { data } = await admin.from("app_config").select("value").eq("key", "global").maybeSingle();
  const cfg = (data?.value ?? {}) as { announcement?: string; maintenance?: boolean };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Settings</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>App-wide controls that affect every DailyOS user.</p>
      <SettingsForm announcement={cfg.announcement ?? ""} maintenance={Boolean(cfg.maintenance)} />
    </div>
  );
}
