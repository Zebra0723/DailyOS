import { requireAdminUser } from "@/lib/admin-server";
import { Sidebar } from "@/components/sidebar";

export default async function BaseLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div className="min-h-screen md:flex">
      <Sidebar email={user.email ?? ""} projectRef={process.env.SUPABASE_PROJECT_REF} />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
