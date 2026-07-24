import { requireAdminUser } from "@/lib/admin-server";
import { Sidebar } from "@/components/sidebar";
import { pendingReplyCount } from "@/lib/replies";
import { openBugCount } from "@/lib/bugs";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const [pendingApprovals, openBugs] = await Promise.all([pendingReplyCount(), openBugCount()]);
  return (
    <div className="min-h-screen md:flex">
      <Sidebar email={user.email ?? ""} pendingApprovals={pendingApprovals} openBugs={openBugs} />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
