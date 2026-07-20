"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ExternalLink, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

interface AppNav {
  key: string;
  label: string;
  url: string;
  dot: string;
}

export function Sidebar({ email, apps }: { email: string; apps: AppNav[] }) {
  const pathname = usePathname();
  const active = pathname === "/hub";
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/verify";
  }
  const linked = apps.filter((a) => a.url);
  return (
    <aside className="border-b border-[#e6ded2] bg-[#fffdf9] md:flex md:min-h-screen md:w-56 md:flex-col md:border-b-0 md:border-r">
      <div className="px-4 pb-2 pt-4">
        <Link href="/hub"><Logo /></Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
        <Link
          href="/hub"
          className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-[#bf502b] text-white" : "text-[#4b443b] hover:bg-[#f2e6da]"}`}
        >
          <LayoutDashboard className="size-4 shrink-0" /> Dashboard
        </Link>
        {linked.length > 0 && (
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#a89b8a]">Apps</p>
        )}
        {linked.map((a) => (
          <a
            key={a.key}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[#4b443b] transition-colors hover:bg-[#f2e6da]"
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.dot }} />
            {a.label}
            <ExternalLink className="ml-auto size-3.5 shrink-0 text-[#a89b8a]" />
          </a>
        ))}
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
