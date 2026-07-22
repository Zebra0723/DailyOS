import { loadSurveyResponses } from "@/lib/survey";
import { SurveyView } from "@/components/survey-view";
import { ErrorBanner } from "@/components/error-banner";

export const dynamic = "force-dynamic";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SurveyPage() {
  const { items, error } = await loadSurveyResponses();

  // Date range across all responses (rows come back newest-first).
  let range: string | null = null;
  if (items.length > 0) {
    const times = items
      .map((i) => new Date(i.created_at).getTime())
      .filter((t) => !Number.isNaN(t));
    if (times.length > 0) {
      const min = fmt(new Date(Math.min(...times)).toISOString());
      const max = fmt(new Date(Math.max(...times)).toISOString());
      range = min === max ? min : `${min} – ${max}`;
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Survey</h1>
        <p className="text-sm text-[#6b6157]">
          {error
            ? "How people are experiencing DailyOS"
            : items.length === 0
              ? "How people are experiencing DailyOS"
              : `${items.length} response${items.length === 1 ? "" : "s"}${range ? ` · ${range}` : ""}`}
        </p>
      </div>
      {error ? <ErrorBanner error={error} /> : <SurveyView items={items} />}
    </div>
  );
}
