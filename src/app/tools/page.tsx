import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Receipt, Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Life-Admin Tools | DailyOS",
  description:
    "Free, no-sign-up tools to get your life admin under control — track subscription costs and never miss a renewal. Made by DailyOS.",
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: "Free Life-Admin Tools | DailyOS",
    description:
      "Free, no-sign-up tools to get your life admin under control.",
    type: "website",
    url: `${SITE_URL}/tools`,
  },
};

const TOOLS = [
  {
    href: "/tools/subscription-tracker",
    icon: Receipt,
    title: "Subscription Cost Tracker",
    body: "See exactly what your subscriptions cost you each month and year — and which to cancel.",
  },
  {
    href: "/tools/renewal-tracker",
    icon: Bell,
    title: "Renewal & Warranty Tracker",
    body: "Add your renewals, free-trial end dates and warranties, and see what's coming up next.",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container max-w-4xl py-16">
        <div className="text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Free life-admin tools
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            Small, genuinely useful tools — no sign-up, no card. Made by the team
            behind DailyOS, which handles all of this for you automatically.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
            >
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="size-5" />
              </div>
              <h2 className="font-semibold">{t.title}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open tool
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/30 to-background p-8 text-center shadow-elevated">
          <h2 className="text-2xl font-bold tracking-tight">
            Want it all handled automatically?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            DailyOS turns receipts, letters, bookings and emails into tasks,
            calendar events, reminders and a searchable vault — the whole of your
            life admin, in one calm place.
          </p>
          <Button size="lg" asChild className="mt-6 h-12 px-7 text-base shadow-elevated">
            <Link href="/signup">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DailyOS
          </p>
        </div>
      </footer>
    </div>
  );
}
