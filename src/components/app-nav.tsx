"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Inbox,
  Calendar,
  CheckSquare,
  Archive,
  Settings,
  Plus,
  LogOut,
  StickyNote,
  Lock,
  Home,
  CalendarClock,
  CalendarCheck,
  Heart,
  Globe,
  Search,
  Sparkles,
  Menu,
  X,
  CreditCard,
} from "lucide-react";
import { OPEN_COMMAND_EVENT } from "@/components/command-palette";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/use-pro";
import { HOME_SECTIONS, homeHref } from "@/components/homeos/tabs";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// "Ultra categories" — now the top-level tabs of the top command bar.
// `lead` is where the category tab points; `items` is its contextual sub-nav.
const CATEGORIES: {
  key: string;
  lead: string;
  items: NavItem[];
}[] = [
  {
    key: "LifeOS",
    lead: "/today",
    items: [
      { href: "/today", label: "Today", icon: Sun },
      { href: "/assistant", label: "Ask DailyOS", icon: Sparkles },
      { href: "/inbox", label: "The Drop", icon: Inbox },
      { href: "/build-day", label: "Build My Day", icon: CalendarClock },
      { href: "/interests", label: "Interests", icon: Heart },
      { href: "/world-clock", label: "World Clock", icon: Globe },
      { href: "/notes", label: "Notes", icon: StickyNote },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/review", label: "Review", icon: CalendarCheck },
      { href: "/vault", label: "Vault", icon: Archive },
    ],
  },
  {
    key: "HomeOS",
    lead: "/homeos",
    items: [{ href: "/homeos", label: "HomeOS", icon: Home }],
  },
  {
    key: "Account",
    lead: "/subscriptions",
    items: [
      { href: "/subscriptions", label: "Subscription", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Bottom bar (mobile): four key destinations + a "More" menu for everything.
const BOTTOM = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/assistant", label: "Ask", icon: Sparkles },
  { href: "/inbox", label: "Drop", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const catByKey = (key: string) =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

// Which top-level category owns the current route? Longest-prefix wins.
function activeCategory(pathname: string) {
  if (pathname.startsWith("/homeos")) return catByKey("HomeOS");
  let best = CATEGORIES[0];
  let bestLen = -1;
  for (const cat of CATEGORIES) {
    for (const it of cat.items) {
      if (isActive(pathname, it.href) && it.href.length > bestLen) {
        best = cat;
        bestLen = it.href.length;
      }
    }
  }
  return best;
}

export function TopNav({ email, userId }: { email: string; userId?: string }) {
  const pathname = usePathname();
  const { tier } = usePlan(userId);
  const vaultLocked = tier === "free"; // Vault & Build My Day (Plus+)
  const homeLocked = tier === "free"; // HomeOS is now Plus+
  const askLocked = tier !== "pro"; // Ask DailyOS is Pro

  const current = activeCategory(pathname);

  // Inside HomeOS, the contextual bar expands into the OS sub-sections.
  const subItems: NavItem[] =
    current.key === "HomeOS" && pathname.startsWith("/homeos")
      ? HOME_SECTIONS.map((s) => ({
          href: homeHref(s.seg),
          label: s.label,
          icon: s.icon,
        }))
      : current.items;

  const showSubBar = subItems.length > 1;

  function signOut() {
    // Clear the local session copy, then let the server route clear the auth
    // cookies and redirect to /login (so /login can't bounce back to /today).
    try {
      void createClient().auth.signOut({ scope: "local" });
    } catch {
      /* ignore */
    }
    window.location.href = "/auth/signout";
  }

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/85 backdrop-blur-xl md:block">
      {/* Masthead row: logo · categories · actions */}
      <div className="container flex h-16 max-w-6xl items-center gap-6">
        <Link href="/today" className="shrink-0">
          <Logo />
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {CATEGORIES.map((cat) => {
            const active = cat.key === current.key;
            const locked =
              (cat.key === "HomeOS" && homeLocked) ? true : false;
            return (
              <Link
                key={cat.key}
                href={cat.lead}
                className={cn(
                  "group relative rounded-full px-3.5 py-1.5 text-sm font-medium tracking-tight transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {cat.key}
                  {locked && <Lock className="size-3 text-muted-foreground/60" />}
                </span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Search"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden rounded border px-1.5 text-[10px] lg:inline">
              ⌘K
            </kbd>
          </button>
          <Button asChild size="sm" className="shadow-elevated">
            <Link href="/inbox/new">
              <Plus className="size-4" />
              Add
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div
            className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            title={email}
          >
            {initials(email)}
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

      {/* Contextual sub-nav row for the active category */}
      {showSubBar && (
        <div className="border-t border-border/70 bg-muted/30">
          <div className="container flex max-w-6xl items-center gap-1 overflow-x-auto py-1.5">
            {subItems.map((l) => {
              const active = isActive(pathname, l.href);
              const locked =
                ((l.href === "/vault" || l.href === "/build-day") &&
                  vaultLocked) ||
                (l.href === "/homeos" && homeLocked) ||
                (l.href === "/assistant" && askLocked);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <l.icon
                    className={cn(
                      "size-[16px]",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  {l.label}
                  {locked && (
                    <Lock className="size-3 text-muted-foreground/60" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileNav({ email, userId }: { email?: string; userId?: string }) {
  const pathname = usePathname();
  const { tier } = usePlan(userId);
  const vaultLocked = tier === "free"; // Vault & Build My Day (Plus+)
  const homeLocked = tier === "free"; // HomeOS is now Plus+
  const askLocked = tier !== "pro"; // Ask DailyOS is Pro
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false); // close the drawer whenever the route changes
  }, [pathname]);

  async function signOut() {
    try {
      void createClient().auth.signOut({ scope: "local" });
    } catch {
      /* ignore */
    }
    window.location.href = "/auth/signout";
  }

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 pb-safe backdrop-blur md:hidden">
        {BOTTOM.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              isActive(pathname, l.href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <l.icon className="size-5" />
            {l.label}
          </Link>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          aria-label="More"
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>

      {/* Full-nav drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 flex w-[82%] max-w-xs flex-col bg-card shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Link href="/today" onClick={() => setMenuOpen(false)}>
                <Logo />
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              <Button asChild className="w-full justify-start">
                <Link href="/inbox/new" onClick={() => setMenuOpen(false)}>
                  <Plus className="size-4" /> Add to the Drop
                </Link>
              </Button>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
              {CATEGORIES.map((cat) => (
                <div key={cat.key}>
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {cat.key}
                  </p>
                  {cat.items.map((l) => {
                    const active = isActive(pathname, l.href);
                    const locked =
                      ((l.href === "/vault" || l.href === "/build-day") && vaultLocked) ||
                      (l.href === "/homeos" && homeLocked) ||
                      (l.href === "/assistant" && askLocked);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <l.icon
                          className={cn("size-[18px]", active ? "text-primary" : "text-muted-foreground")}
                        />
                        {l.label}
                        {locked && <Lock className="ml-auto size-3.5 text-muted-foreground/60" />}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="border-t px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(email ?? "")}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{email}</p>
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b bg-background/90 px-4 pt-safe backdrop-blur md:hidden">
      <Link href="/today">
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
          aria-label="Search"
          className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <Search className="size-5" />
        </button>
        <Button size="sm" asChild>
          <Link href="/inbox/new">
            <Plus className="size-4" />
            Add
          </Link>
        </Button>
      </div>
    </header>
  );
}
