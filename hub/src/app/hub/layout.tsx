import { requireAdminUser } from "@/lib/admin-server";
import { Sidebar } from "@/components/sidebar";
import { appLinks } from "@/lib/hub";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  const apps = appLinks().map(({ key, label, url, dot }) => ({ key, label, url, dot }));
  return (
    <div className="min-h-screen md:flex">
      <Sidebar email={user.email ?? ""} apps={apps} />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
