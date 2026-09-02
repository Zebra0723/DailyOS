import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  Smartphone,
  Ticket,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/codes", label: "Codes", icon: Ticket },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/push", label: "Push", icon: Bell },
  { href: "/admin/devices", label: "Devices", icon: Smartphone },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    redirect("/today");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Admin</h1>
      </div>

      {/* Navigation — horizontal scroll on mobile, row on desktop */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
