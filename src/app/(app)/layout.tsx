import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileNav, MobileHeader } from "@/components/app-nav";
import { FreePlanBanner } from "@/components/free-plan-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards these routes, but double-check on the server.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-accent/50 via-background to-background">
      <Sidebar email={user.email ?? "you@dailyos.app"} userId={user.id} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <FreePlanBanner userId={user.id} />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="container max-w-5xl py-6 md:py-10">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
