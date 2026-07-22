"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, CheckCircle2, TrendingUp, Users, Download, ClipboardList, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/support", label: "Inbox", icon: Inbox },
  { href: "/support/resolved", label: "Resolved", icon: CheckCircle2 },
  { href: "/support/trends", label: "Trends", icon: TrendingUp },
  { href: "/support/people", label: "People", icon: Users },
  { href: "/support/export", label: "Export", icon: Download },
  { href: "/support/survey", label: "Survey", icon: ClipboardList },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/support" ? pathname === "/support" : pathname.startsWith(href);
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/verify";
  }
  return (
    <aside className="border-b border-[#e6ded2] bg-[#fffdf9] md:flex md:min-h-screen md:w-56 md:flex-col md:border-b-0 md:border-r">
      <div className="px-4 pb-2 pt-4">
        <Link href="/support"><Logo /></Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
        {NAV.map((n) => {
          const A = active(n.href);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${A ? "bg-[#bf502b] text-white" : "text-[#4b443b] hover:bg-[#f2e6da]"}`}
            >
              <Icon className="size-4 shrink-0" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-[#e6ded2] p-3 md:block">
        <p className="mb-2 truncate text-xs text-[#8a8073]">{email}</p>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-[#6b6157] hover:text-[#1c1a17]">
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
