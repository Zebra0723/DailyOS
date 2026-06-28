import Link from "next/link";
import {
  ArrowRight,
  Plane,
  Receipt,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Inbox,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PricingTable } from "@/components/pricing-table";

const steps = [
  {
    title: "Drop anything in",
    body: "Forward an email, paste text, or upload a receipt, PDF or screenshot.",
    icon: Inbox,
  },
  {
    title: "DailyOS understands it",
    body: "It reads the content and pulls out dates, tasks, events and key details.",
    icon: Sparkles,
  },
  {
    title: "Review and approve",
    body: "Nothing is added until you say so. Tweak anything in one tap.",
    icon: CheckCircle2,
  },
  {
    title: "Your life admin is organised",
    body: "Tasks, calendar and a searchable vault — all kept neatly in one place.",
    icon: ShieldCheck,
  },
];

const useCases = [
  { icon: Plane, from: "Flight booking", to: "Calendar event + check-in reminder" },
  { icon: Receipt, from: "Receipt", to: "Saved in Purchases" },
  { icon: ShieldCheck, from: "Warranty", to: "Expiry reminder" },
  { icon: GraduationCap, from: "School letter", to: "Event + task" },
  { icon: RefreshCw, from: "Subscription email", to: "Renewal reminder" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[420px] opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, hsl(var(--accent)) 0%, transparent 70%)",
          }}
        />
        <div className="container relative grid gap-12 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-card">
              <Sparkles className="size-4 text-primary" />
              Chaos into clarity — your personal chief of staff
            </div>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              Your life admin,
              <br className="hidden sm:block" />{" "}
              <span className="bg-gradient-to-r from-primary to-[#5BC2D4] bg-clip-text text-transparent">
                finally handled.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
              Drop in receipts, bookings, school letters, screenshots, PDFs and
              reminders. DailyOS reads them and sorts everything into tasks,
              calendar events and a searchable vault.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-7 text-base shadow-elevated">
                <Link href="/signup">
                  Start your Life Inbox
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-7 text-base"
              >
                <Link href="/login">Log in</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free to start · No card required · Private by design
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Four calm steps from chaos to handled.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="size-5" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Real life, sorted
            </h2>
            <p className="mt-3 text-muted-foreground">
              A few of the things DailyOS handles for you.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-3">
            {useCases.map((u) => (
              <div
                key={u.from}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <u.icon className="size-5" />
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{u.from}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{u.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Simple pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when life gets busy.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-5xl">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* Privacy strip */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Lock className="size-6" />
            </div>
            <h2 className="text-xl font-semibold">Private by design</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Your data is yours. Every item is locked to your account with
              row-level security, files are stored privately, and you can delete
              everything in one tap from Settings.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DailyOS. Life admin, handled.
          </p>
        </div>
      </footer>
    </div>
  );
}
