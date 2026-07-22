import { createServiceClient } from "@/lib/supabase/service";
import { cronConfigured, MAIN_APP_URL } from "@/lib/main";
import { readGlobal } from "@/lib/pulse-data";
import { OpsControls } from "@/components/ops-controls";

export const dynamic = "force-dynamic";

export default async function ControlsPage() {
  const admin = createServiceClient();
  const global = await readGlobal(admin);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Controls</h1>
        <p className="text-sm text-[#6b6157]">Operate DailyOS at {MAIN_APP_URL.replace(/^https?:\/\//, "")} — banner, maintenance, and cron.</p>
      </div>

      <OpsControls
        initialAnnouncement={global.announcement ?? ""}
        initialMaintenance={!!global.maintenance}
        cronConfigured={cronConfigured()}
      />
    </div>
  );
}
