import { loadFeedback } from "@/lib/feedback";
import { PeopleView } from "@/components/people-view";
import { ErrorBanner } from "@/components/error-banner";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { items, error } = await loadFeedback();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">People</h1>
        <p className="text-sm text-[#6b6157]">Who&apos;s writing in — grouped by email, top reporters first</p>
      </div>
      {error ? <ErrorBanner error={error} /> : <PeopleView items={items} />}
    </div>
  );
}
