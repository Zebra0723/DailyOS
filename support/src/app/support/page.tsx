import { loadFeedback } from "@/lib/feedback";
import { loadRepliesGrouped } from "@/lib/replies";
import { FeedbackList } from "@/components/feedback-list";
import { ErrorBanner } from "@/components/error-banner";
import { requireAdminUser } from "@/lib/admin-server";
import { isOwner } from "@/lib/owner";
import { emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await requireAdminUser();
  const { items, error } = await loadFeedback();
  const { byFeedback } = await loadRepliesGrouped();
  const open = items.filter((f) => !f.resolved);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-[#6b6157]">
          {open.length} open · triage, reply, and resolve incoming feedback
        </p>
      </div>
      {error ? (
        <ErrorBanner error={error} />
      ) : (
        <FeedbackList
          items={open}
          mode="open"
          repliesByFeedback={byFeedback}
          isOwner={isOwner(user.email)}
          emailReady={emailConfigured()}
        />
      )}
    </div>
  );
}
