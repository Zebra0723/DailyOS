import {
  Inbox,
  Sparkles,
  CalendarCheck,
  ListChecks,
  Archive,
  MessageCircleQuestion,
  RefreshCw,
  BellRing,
  Coffee,
  ShieldCheck,
  TrendingUp,
  Share2,
  Wallet,
  ArrowRight,
  Check,
  PenLine,
} from "lucide-react";
import { Logo } from "@/components/logo";

const APP_URL = "https://daily-os-lac.vercel.app";

const NAV = [
  { href: "#who", label: "Who we are" },
  { href: "#features", label: "What it does" },
  { href: "#pitch", label: "The pitch" },
  { href: "#social", label: "Why social" },
  { href: "#safety", label: "Safety" },
];

const FEATURES = [
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

const BENEFITS = [
  {
    icon: Wallet,
    title: "It costs nothing",
    desc: "No stadium banners, no billboards. Social media is free — the only investment is a little time.",
  },
  {
    icon: Share2,
    title: "Real reach",
    desc: "Introduce DailyOS to the right creators and their audiences, and the right people find us fast.",
  },
  {
    icon: TrendingUp,
    title: "Actual users & revenue",
    desc: "Awareness turns into sign-ups. Sign-ups turn into the first real revenue for everything we've built.",
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
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
              D
            </span>
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
              We built DailyOS to give people their time back. Now we want the
              world to know it exists — and this is how.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#who"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
              >
                Read the pitch <ArrowRight className="size-4" />
              </a>
              <a
                href={APP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-5 py-3 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/50"
              >
                See the app
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
                <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  D
                </span>
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

      {/* -------------------------------------------------------------- Stats */}
      <section className="border-b bg-card/60">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {[
            { big: "1", small: "app, fully built & live" },
            { big: "£0", small: "cost to reach people" },
            { big: "8+", small: "ways it handles admin" },
            { big: "24/7", small: "working behind the scenes" },
          ].map((s) => (
            <div key={s.small} className="text-center">
              <div className="font-display text-3xl font-bold text-primary md:text-4xl">
                {s.big}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Who we are */}
      <Section id="who" eyebrow="Who are we?" title="An organisation built to handle life's admin">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <p className="text-lg leading-relaxed text-muted-foreground">
            We are <strong className="text-foreground">DailyOS</strong>, an
            organisation dedicated to helping people organise or handle natural
            life admin. We work to stop the subscriptions that quietly renew and
            organise events that always seem to come so quickly.
          </p>
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <Coffee className="size-7 text-primary" />
            <p className="mt-3 font-display text-xl font-semibold">
              &ldquo;DailyOS is made to give you some time.&rdquo;
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              It works tirelessly behind the scenes while you enjoy a coffee, or
              just a break from an action-packed life.
            </p>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------------- Our goal */}
      <section className="border-y bg-accent/25">
        <div className="container py-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Our goal
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-4xl">
            To organise your life.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Think of it like this: you are a busy parent and you constantly have
            to manage everything from birthday RSVPs to your own personal life
            which is filled with endless activities and you can never find that
            blissful rest period. DailyOS is made to give you some time. It
            organises anything and works tirelessly behind the scenes whilst you
            enjoy a coffee or just a break from an action-packed life.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- Features */}
      <Section
        id="features"
        eyebrow="What it does"
        title="A quick look at DailyOS"
        subtitle="Everything below already works today. It's a real, finished product — not an idea."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-14">
          <h3 className="text-center font-display text-2xl font-bold">
            Drop it in. Get on with your day.
          </h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
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
        </div>
      </Section>

      {/* ------------------------------------------------------ The goal of the pitch */}
      <section id="pitch" className="border-y bg-foreground text-background">
        <div className="container py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">
            The goal of this pitch
          </p>
          <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-5xl">
            One thing is holding us back. Marketing.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
            With this pitch, we want to expose DailyOS to the world. We want to
            help. But one thing is holding us back from global success:
            marketing. As of now, nobody is aware of DailyOS&apos;s existence,
            which means our services will not be used and we will not generate a
            single penny in revenue after hours of tireless work to build and
            perfect DailyOS.
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
            For an app like ours, we don&apos;t need advertisements at a sports
            stadium or a giant billboard.{" "}
            <span className="font-semibold text-primary">
              We need social media.
            </span>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- Benefits of social */}
      <Section
        id="social"
        eyebrow="Benefits of social media"
        title="How we actually reach people"
        subtitle="By introducing DailyOS to various influencers and their viewers, we believe sales will skyrocket and we will start to produce some revenue. Social media comes at no cost and it will actually get people to use what we've made."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------------- Safety */}
      <section id="safety" className="border-y bg-accent/25">
        <div className="container py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Safety
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                I know the real concern is safety.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Social media can be dangerous, even I understand that. But
                don&apos;t forget that using social media for{" "}
                <strong className="text-foreground">DailyOS</strong> is definitely
                not the same as using it for myself. No personal information will
                ever be shared and no identities will be revealed. Also, I
                won&apos;t even be looking at other people&apos;s posts — I would
                use it only for DailyOS.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-6 text-primary" />
                <span className="font-semibold">The ground rules</span>
              </div>
              <ul className="mt-4 space-y-3">
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
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Closing CTA */}
      <section className="relative overflow-hidden">
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
            <p>&copy; {new Date().getFullYear()} DailyOS. All rights reserved.</p>
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
