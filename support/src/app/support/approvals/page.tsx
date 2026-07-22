import { loadPendingWithFeedback } from "@/lib/replies";
import { ApprovalsList } from "@/components/approvals-list";
import { ErrorBanner } from "@/components/error-banner";
import { requireAdminUser } from "@/lib/admin-server";
import { isOwner } from "@/lib/owner";
import { emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireAdminUser();
  const owner = isOwner(user.email);
  const emailReady = emailConfigured();
  const { items, error } = await loadPendingWithFeedback();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-sm text-[#6b6157]">
          {items.length} waiting ·{" "}
          {owner
            ? "review replies drafted by other admins before they're sent"
            : "replies you drafted, waiting on the owner"}
        </p>
      </div>
      {owner && !emailReady && (
        <div className="rounded-xl border border-[#e6ded2] bg-[#f7ece4] p-3 text-sm text-[#6b6157]">
          Email isn't configured yet. You can still approve replies — they'll be marked approved and
          you can send them with the mailto link. Set <code>RESEND_API_KEY</code> and{" "}
          <code>EMAIL_FROM</code> to send automatically.
        </div>
      )}
      {error ? (
        <ErrorBanner error={error} />
      ) : (
        <ApprovalsList items={items} isOwner={owner} emailReady={emailReady} />
      )}
    </div>
  );
}
