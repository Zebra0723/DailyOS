import Link from "next/link";
import {
  LifeBuoy,
  Smartphone,
  Mail,
  ScrollText,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { HomeButton } from "@/components/home-button";
import { InstallApp } from "@/components/install-app";

export const metadata = {
  title: "Help & FAQs · DailyOS",
  description: "Answers about DailyOS, installing the app, contact and legal.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is DailyOS?",
    a: "Your personal chief of staff for life admin. Drop in a receipt, booking, school letter or screenshot and DailyOS reads it and turns it into tasks, calendar events and a searchable vault.",
  },
  {
    q: "How do I add something?",
    a: "Use 'Add to Inbox' — paste text or upload a photo/PDF. DailyOS pulls out the dates and to-dos, and nothing is saved until you review and approve it.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your data is locked to your account with row-level security, files are stored privately, and you can export or permanently delete everything from Settings at any time.",
  },
  {
    q: "Is it free?",
    a: "Free to start, no card needed. Plus and Pro add more — HomeOS, the Vault, Build My Day, the Ask DailyOS assistant and calendar sync. Compare them on the Subscription page.",
  },
  {
    q: "How do I install DailyOS as an app?",
    a: "It's a web app you can add to your home screen — see 'Install the app' below. It then opens full-screen and works offline, just like a store app (no app store needed).",
  },
  {
    q: "How does calendar sync work? (Pro)",
    a: "On Pro, Settings gives you 'Add to Apple Calendar' / 'Add to Google Calendar' buttons that subscribe your calendar to your DailyOS events and due tasks. Times stay in the timezone you set them in.",
  },
  {
    q: "How do referrals work?",
    a: "Share your link — your friend gets 10% off, and the more friends who subscribe, the bigger your reward, up to lifetime Pro. Your codes appear on the Subscription page and on Today.",
  },
  {
    q: "How do I delete my data or account?",
    a: "Settings → Privacy & data. 'Delete data' wipes your content but keeps your login; 'Delete account' removes everything. You can also export a copy first.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/today">
          <Logo tagline />
        </Link>
        <HomeButton />
      </header>

      <main className="container flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Help &amp; FAQs
              </h1>
              <p className="text-sm text-muted-foreground">
                Answers, installing the app, contact and legal — all in one place.
              </p>
            </div>
          </div>

          {/* FAQs */}
          <section className="space-y-2">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border bg-card px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </section>

          {/* Install the app — a little more obvious, gently accented */}
          <section className="mt-8 rounded-2xl border border-primary/30 bg-accent/20 p-5">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              <h2 className="font-medium">Install the app</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Add DailyOS to your home screen — it opens full-screen, works
              offline, and feels like a native app. No app store needed.
            </p>
            <div className="mt-3">
              <InstallApp />
            </div>
          </section>

          {/* Contact + legal */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/contact"
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
            >
              <Mail className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Contact us</p>
                <p className="text-sm text-muted-foreground">Support &amp; enquiries</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <ScrollText className="size-4 text-primary" />
                <p className="font-medium">Legal</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy
                </Link>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>
                <Link href="/cookies" className="text-primary hover:underline">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
        <Link href="/contact" className="hover:text-foreground">Contact</Link>
        <span>© 2026 DailyOS</span>
      </footer>
    </div>
  );
}
