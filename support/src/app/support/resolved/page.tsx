import { loadFeedback } from "@/lib/feedback";
import { loadRepliesGrouped } from "@/lib/replies";
import { FeedbackList } from "@/components/feedback-list";
import { ErrorBanner } from "@/components/error-banner";
import { requireAdminUser } from "@/lib/admin-server";
import { isOwner } from "@/lib/owner";
import { emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function ResolvedPage() {
  const user = await requireAdminUser();
  const { items, error } = await loadFeedback();
  const { byFeedback } = await loadRepliesGrouped();
  const resolved = items.filter((f) => f.resolved);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Resolved</h1>
        <p className="text-sm text-[#6b6157]">
          {resolved.length} archived · reopen anything that needs another look
        </p>
      </div>
      {error ? (
        <ErrorBanner error={error} />
      ) : (
        <FeedbackList
          items={resolved}
          mode="resolved"
          repliesByFeedback={byFeedback}
          isOwner={isOwner(user.email)}
          emailReady={emailConfigured()}
        />
      )}
    </div>
  );
}
