import { loadFeedback } from "@/lib/feedback";
import { ExportView } from "@/components/export-view";
import { ErrorBanner } from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const { items, error } = await loadFeedback();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-sm text-[#6b6157]">Download the feedback archive or copy a shareable digest</p>
      </div>
      {error ? <ErrorBanner error={error} /> : <ExportView items={items} />}
    </div>
  );
}
