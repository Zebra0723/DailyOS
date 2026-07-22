import { getGlobalConfig } from "@/lib/hub";
import { QuickActions } from "@/components/quick-actions";
import { AnnouncementForm } from "@/components/announcement-form";

export const dynamic = "force-dynamic";

export default async function ControlsPage() {
  const { maintenance, announcement } = await getGlobalConfig();
  const cronEnabled = !!process.env.CRON_SECRET;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Controls</h1>
        <p className="text-sm text-[#6b6157]">Operate the live app: run the push cron, flip maintenance, and set the global announcement.</p>
      </div>

      <QuickActions cronEnabled={cronEnabled} maintenance={maintenance} />

      <section>
        <h2 className="mb-3 text-base font-bold">Announcement</h2>
        <AnnouncementForm current={announcement} />
      </section>
    </div>
  );
}
