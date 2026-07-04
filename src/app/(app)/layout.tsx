import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav, MobileNav, MobileHeader } from "@/components/app-nav";
import { FreePlanBanner } from "@/components/free-plan-banner";
import { CommandPalette } from "@/components/command-palette";

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
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav email={user.email ?? "you@example.com"} userId={user.id} />
      <MobileHeader />
      <FreePlanBanner userId={user.id} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container max-w-6xl py-8 md:py-12">{children}</div>
      </main>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
