import { requireAdminUser } from "@/lib/admin-server";
import { Sidebar } from "@/components/sidebar";
import { countUnread } from "@/lib/comms";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const unread = await countUnread(user.email ?? "");
  return (
    <div className="min-h-screen md:flex">
      <Sidebar email={user.email ?? ""} unread={unread} />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
