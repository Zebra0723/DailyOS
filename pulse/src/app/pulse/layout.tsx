import { requireAdminUser } from "@/lib/admin-server";
import { Sidebar } from "@/components/sidebar";
import { MAIN_APP_URL } from "@/lib/main";

export default async function PulseLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div className="min-h-screen md:flex">
      <Sidebar email={user.email ?? ""} mainUrl={MAIN_APP_URL} />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
