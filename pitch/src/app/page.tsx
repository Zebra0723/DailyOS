import {
  Inbox,
  Sparkles,
  CalendarCheck,
  ListChecks,
  Archive,
  MessageCircleQuestion,
  RefreshCw,
  BellRing,
  Wallet,
  ArrowRight,
  Check,
  PenLine,
  Brain,
  AlarmClockOff,
  FolderX,
  CreditCard,
  Users,
  Lock,
  Smartphone,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LogoMark } from "@/components/logo-mark";

const APP_URL = "https://daily-os-lac.vercel.app";

const NAV = [
  { href: "#problem", label: "The problem" },
  { href: "#solution", label: "The solution" },
  { href: "#how", label: "How it works" },
  { href: "#matters", label: "Why it matters" },
  { href: "#ask", label: "The ask" },
];

const PROBLEMS = [
  {
    icon: FolderX,
    title: "It's scattered everywhere",
    desc: "A letter in a bag, a receipt in an inbox, a booking in a text. Life admin lives in a hundred places at once.",
  },
  {
    icon: AlarmClockOff,
    title: "Things slip through",
    desc: "The form you meant to return, the appointment you half-remembered — the important stuff quietly falls off the edge.",
  },
  {
    icon: CreditCard,
    title: "Money leaks quietly",
    desc: "Subscriptions renew on their own. Small fees and deadlines pile up while nobody's watching.",
  },
  {
    icon: Brain,
    title: "It never leaves your head",
    desc: "Even when you're resting, the mental list keeps running. The load follows you into every quiet moment.",
  },
];

const SOLUTION = [
  {
    icon: Inbox,
    title: "The Drop",
    desc: "Fire in a receipt, a school letter, a booking or a screenshot — anything, straight into one place.",
  },
  {
    icon: Sparkles,
    title: "It reads it for you",
    desc: "DailyOS pulls out the dates, amounts and to-dos automatically. No typing, no forms.",
  },
  {
    icon: CalendarCheck,
    title: "Calendar & events",
    desc: "The important dates become real events with reminders, so nothing sneaks up on you.",
  },
  {
    icon: ListChecks,
    title: "Tasks, sorted",
    desc: "Every action it finds becomes a clear, prioritised task you can tick off.",
  },
  {
    icon: RefreshCw,
    title: "Subscriptions watch",
    desc: "It catches the subscriptions that quietly renew before they take another payment.",
  },
  {
    icon: Archive,
    title: "The Vault",
    desc: "Everything filed in a calm, searchable archive you can actually trust and find later.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask DailyOS",
    desc: "A built-in assistant that answers questions and can add things to your calendar for you.",
  },
  {
    icon: BellRing,
    title: "Reminders",
    desc: "Gentle nudges at the right moment, so the mental load lives in the app — not in your head.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Drop it in",
    desc: "Snap it, paste it, forward it. If it's life admin, it goes in the Drop.",
  },
  {
    n: "2",
    title: "We read it",
    desc: "DailyOS works out what it is and what needs doing — in seconds.",
  },
  {
    n: "3",
    title: "It's handled",
    desc: "Tasks, events and reminders appear. You get back to your coffee.",
  },
];

const MATTERS = [
  {
    icon: Users,
    label: "Built for real families",
    desc: "Designed around busy parents and the everyday admin that actually piles up.",
  },
  {
    icon: Lock,
    label: "Private by design",
    desc: "Your documents and details stay yours. Nothing about you is put on display.",
  },
  {
    icon: Smartphone,
    label: "Works on every device",
    desc: "Phone, tablet or laptop — it installs like an app and travels with you.",
  },
  {
    icon: Heart,
    label: "Made to give time back",
    desc: "The whole point is a lighter head and a few more calm moments in the day.",
  },
];

const SAFETY = [
  "No personal information is ever shared.",
  "No identities are revealed — it's a brand page, not a personal one.",
  "It's used only for DailyOS — never for browsing others' posts.",
  "Comments and messages stay under our control.",
];

export default function PitchPage() {
  return (
    <main className="min-h-screen">
      {/* ---------------------------------------------------------------- Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2">
            <LogoMark className="size-8 shrink-0" />
            <Logo className="text-xl" />
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
          >
            Visit DailyOS <ArrowRight className="size-4" />
          </a>
        </div>
      </header>

      {/* --------------------------------------------------------------- Hero */}
      <section id="top" className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="container relative grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent/50 px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Sparkles className="size-3.5" /> A pitch for DailyOS
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Life admin,
              <br />
              <span className="text-primary">handled.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              DailyOS turns the chaos of everyday life admin into tasks, events
              and reminders that just get handled — so you get your time back.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={APP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
              >
                Try the live app <ArrowRight className="size-4" />
              </a>
              <a
                href="#problem"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-5 py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/50"
              >
                Read the pitch
              </a>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm">
              <PenLine className="size-4 text-primary" />
              Written by me — none of this pitch was written by AI.
            </p>
          </div>

          {/* Little "drop → handled" app mock */}
          <div className="animate-fade-up md:justify-self-end">
            <div className="w-full max-w-sm rounded-3xl border bg-card p-5 shadow-elevated">
              <div className="flex items-center gap-2 border-b pb-3">
                <LogoMark className="size-7 shrink-0" />
                <Logo className="text-base" />
                <span className="ml-auto text-xs text-muted-foreground">Today</span>
              </div>
              <div className="space-y-3 pt-4">
                <MockRow
                  icon={Inbox}
                  tone="accent"
                  title="School trip letter"
                  sub="Dropped in · just now"
                />
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    <Sparkles className="size-3" /> DailyOS read it
                  </span>
                </div>
                <MockRow
                  icon={CalendarCheck}
                  tone="card"
                  title="Trip to the museum"
                  sub="Thu 09:00 · reminder set"
                />
                <MockRow
                  icon={ListChecks}
                  tone="card"
                  title="Sign & return the slip"
                  sub="Task · due Tuesday"
                />
                <MockRow
                  icon={Wallet}
                  tone="card"
                  title="Pay £12 trip fee"
                  sub="Task · due Tuesday"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Problem */}
      <Section
        id="problem"
        eyebrow="The problem"
        title="Life admin is quietly exhausting"
        subtitle="Nobody signs up for it, but it never stops arriving. Here's what it actually feels like."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border bg-card p-5 shadow-card"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------- Solution */}
      <section id="solution" className="border-y bg-accent/25">
        <div className="container py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            The solution
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            Drop the mess in. Get it back handled.
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            DailyOS takes the scattered pile of life admin and turns it into
            clear tasks, real calendar events and a searchable vault — all on its
            own. Everything below already works today. It&apos;s a real, finished
            product, not an idea.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTION.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <Section
        id="how"
        eyebrow="How it works"
        title="Three steps, then it's off your plate"
        subtitle="No setup rituals, no learning curve. If it's life admin, it goes in the Drop."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border bg-card p-6 shadow-card">
              <span className="grid size-10 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                {s.n}
              </span>
              <h4 className="mt-4 text-lg font-semibold">{s.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- Why it matters */}
      <section id="matters" className="border-y bg-foreground text-background">
        <div className="container py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">
            Why it matters
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-5xl">
            What we&apos;re building it to be
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
            These aren&apos;t vanity numbers — they&apos;re the promises DailyOS
            is built around. This is the bar we hold ourselves to.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MATTERS.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-background/15 bg-background/5 p-6"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-primary/20 text-primary-foreground">
                  <m.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {m.label}
                </h3>
                <p className="mt-1.5 text-sm text-background/70">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- The ask */}
      <section id="ask" className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            What I&apos;m asking for
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Just one thing: let DailyOS go on social media.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            I&apos;ve built the whole app. The only thing standing between DailyOS
            and the families it could help is that nobody knows it exists yet. An
            app like this doesn&apos;t need billboards or expensive ads — it needs
            a few social-media accounts so the right people can find it. It costs
            nothing but a little time, and it&apos;s how we turn hours of work into
            real users.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border bg-card p-6 shadow-card md:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <span className="font-semibold">And I know the real worry is safety</span>
          </div>
          <p className="mt-3 text-muted-foreground">
            Running accounts for a brand is not the same as being on social media
            myself. Here are the ground rules I&apos;ll stick to:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SAFETY.map((s) => (
              <li key={s} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- Closing CTA */}
      <section className="relative overflow-hidden border-t">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container relative py-20 text-center md:py-28">
          <Logo className="text-2xl" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight md:text-5xl">
            Let&apos;s put DailyOS on the map.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            We&apos;ve done the hard part — building something that genuinely
            helps. All that&apos;s left is letting people find it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              Explore DailyOS <ArrowRight className="size-4" />
            </a>
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-6 py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/50"
            >
              Back to top
            </a>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Footer */}
      <footer className="border-t bg-card">
        <div className="container flex flex-col items-center gap-4 py-8 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <PenLine className="size-4 text-primary" />
            Every word of this pitch was written by me — none of it was written by AI.
          </p>
          <div className="flex w-full flex-col items-center justify-between gap-2 border-t pt-5 sm:flex-row">
            <div className="flex items-center gap-2">
              <Logo className="text-base" />
              <span className="text-muted-foreground/70">
                · Life admin, handled.
              </span>
            </div>
            <p>&copy; {new Date().getFullYear()} DailyOS. Made with care.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------------------------------------------------------------- helpers */

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="container py-16 md:py-20">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function MockRow({
  icon: Icon,
  title,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  tone: "accent" | "card";
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        tone === "accent" ? "bg-accent/50" : "bg-background"
      }`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
