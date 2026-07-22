import { loadFeedback } from "@/lib/feedback";
import { TrendsView } from "@/components/trends-view";
import { ErrorBanner } from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { items, error } = await loadFeedback();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Trends</h1>
        <p className="text-sm text-[#6b6157]">Feedback volume over time and how the queue is moving</p>
      </div>
      {error ? <ErrorBanner error={error} /> : <TrendsView items={items} />}
    </div>
  );
}
