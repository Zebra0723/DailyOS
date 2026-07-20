import { createServiceClient } from "@/lib/supabase/service";
import { FeedbackList, type Feedback } from "@/components/feedback-list";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const admin = createServiceClient();
  let items: Feedback[] = [];
  let error: string | null = null;
  try {
    const res = await admin
      .from("feedback")
      .select("id,email,message,resolved,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (res.error) error = res.error.message;
    else items = (res.data ?? []) as Feedback[];
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const open = items.filter((f) => !f.resolved).length;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Support inbox</h1>
        <p className="text-sm text-[#6b6157]">{open} open · {items.length} total</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          {error.includes("does not exist") || error.includes("schema cache")
            ? "The feedback table doesn't exist yet — create it from DailyOS Base → SQL → Apply setup."
            : error}
        </div>
      ) : (
        <FeedbackList items={items} />
      )}
    </div>
  );
}
