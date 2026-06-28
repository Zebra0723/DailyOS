"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Inbox,
  Calendar,
  CheckSquare,
  Archive,
  Settings,
  Plus,
  LogOut,
  Flower2,
  StickyNote,
  SmilePlus,
  ListChecks,
  Lock,
  Home,
  Mail,
  MessageSquare,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/use-pro";
import { HOME_SECTIONS, homeHref } from "@/components/homeos/tabs";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// "Ultra categories" — sidebar groups.
const NAV_GROUPS = [
  {
    heading: "LifeOS",
    items: [
      { href: "/today", label: "Today", icon: Sun },
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/vault", label: "Vault", icon: Archive },
    ],
  },
  {
    heading: "HomeOS",
    items: [{ href: "/homeos", label: "HomeOS", icon: Home }],
  },
  {
    heading: "OrganizerOS",
    items: [
      { href: "/ai-suggestions/gmail", label: "Gmail", icon: Mail },
      { href: "/ai-suggestions/applemail", label: "Apple Mail", icon: Inbox },
      { href: "/ai-suggestions/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/ai-suggestions/sms", label: "SMS", icon: MessageSquare },
    ],
  },
  {
    heading: "Wellbeing",
    items: [
      { href: "/mindfulness", label: "Mindfulness", icon: Flower2 },
      { href: "/mood", label: "Mood", icon: SmilePlus },
      { href: "/nudges", label: "Nudges", icon: ListChecks },
    ],
  },
  {
    heading: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

// Bottom bar (mobile): the most-used destinations.
const MOBILE_LINKS = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/homeos", label: "HomeOS", icon: Home },
  { href: "/calendar", label: "Cal", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/ai-suggestions", label: "Sort", icon: Sparkles },
  { href: "/wellbeing", label: "Calm", icon: Flower2 },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ email, userId }: { email: string; userId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tier } = usePlan(userId);
  const vaultLocked = tier === "free";
  const homeLocked = tier !== "pro";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/70 px-4 py-5 backdrop-blur-xl md:flex">
      <div className="px-1 py-1">
        <Link href="/today">
          <Logo />
        </Link>
      </div>

      <div className="mt-6">
        <Button asChild className="w-full justify-start shadow-elevated">
          <Link href="/inbox/new">
            <Plus className="size-4" />
            Add to Inbox
          </Link>
        </Button>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-5">
        {NAV_GROUPS.map((group) => {
          // When inside HomeOS, expand it into its OS sub-sections.
          const items =
            group.heading === "HomeOS" && pathname.startsWith("/homeos")
              ? HOME_SECTIONS.map((s) => ({
                  href: homeHref(s.seg),
                  label: s.label,
                  icon: s.icon,
                }))
              : group.items;
          return (
          <div key={group.heading} className="flex flex-col gap-0.5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.heading}
            </p>
            {items.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <l.icon
                    className={cn(
                      "size-[18px]",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {l.label}
                  {((l.href === "/vault" && vaultLocked) ||
                    (l.href === "/homeos" && homeLocked)) && (
                    <Lock className="ml-auto size-3.5 text-muted-foreground/60" />
                  )}
                </Link>
              );
            })}
          </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t pt-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{email}</p>
          </div>
          <button
            onClick={signOut}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t bg-card/95 backdrop-blur md:hidden">
      {MOBILE_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            isActive(pathname, l.href)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <l.icon className="size-5" />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
      <Link href="/today">
        <Logo />
      </Link>
      <Button size="sm" asChild>
        <Link href="/inbox/new">
          <Plus className="size-4" />
          Add
        </Link>
      </Button>
    </header>
  );
}
