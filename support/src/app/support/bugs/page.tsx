import { loadBugReports } from "@/lib/bugs";
import { BugList } from "@/components/bug-list";
import { ErrorBanner } from "@/components/error-banner";
import { requireAdminUser } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export default async function BugsPage() {
  await requireAdminUser();
  const { items, error } = await loadBugReports();
  const open = items.filter((b) => b.status === "open").length;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Bugs</h1>
        <p className="text-sm text-[#6b6157]">
          {open} open · {items.length} total — triage in-app bug reports with their captured context
        </p>
      </div>
      {error ? <ErrorBanner error={error} /> : <BugList items={items} />}
    </div>
  );
}
