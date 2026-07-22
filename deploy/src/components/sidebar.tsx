"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Rocket, FolderGit2, KeyRound, Globe, ExternalLink, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

const ACCENT = "#bf502b";
const NAV = [
  { href: "/deploy", label: "Overview", icon: LayoutDashboard },
  { href: "/deploy/deployments", label: "Deployments", icon: Rocket },
  { href: "/deploy/projects", label: "Projects", icon: FolderGit2 },
  { href: "/deploy/env", label: "Env", icon: KeyRound },
  { href: "/deploy/domains", label: "Domains", icon: Globe },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/deploy" ? pathname === "/deploy" : pathname.startsWith(href));
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/verify";
  }
  return (
    <aside className="border-b border-[#e6ded2] bg-[#fffdf9] md:flex md:min-h-screen md:w-56 md:flex-col md:border-b-0 md:border-r">
      <div className="px-4 pb-2 pt-4"><Link href="/deploy"><Logo /></Link></div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
        {NAV.map((n) => {
          const A = active(n.href);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${A ? "" : "hover:bg-[#f2e6da]"}`}
              style={A ? { background: ACCENT, color: "#fff" } : { color: "#4b443b" }}>
              <Icon className="size-4 shrink-0" /> {n.label}
            </Link>
          );
        })}
        <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[#4b443b] hover:bg-[#f2e6da]">
          <ExternalLink className="size-4 shrink-0" /> Open Vercel
        </a>
      </nav>
      <div className="mt-auto hidden border-t border-[#e6ded2] p-3 md:block">
        <p className="mb-2 truncate text-xs text-[#8a8073]">{email}</p>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-[#6b6157] hover:text-[#1c1a17]"><LogOut className="size-4" /> Sign out</button>
      </div>
    </aside>
  );
}
